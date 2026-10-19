import { EventEmitter } from 'events';
import { MqttClient } from 'mqtt';
import { mqttClientManager } from './client';
import { SENSOR_TOPIC_WILDCARD, parseSensorTopic } from './topics';
import { sensorPayloadSchema, ValidatedSensorPayload } from './validation';
import { sensorRepository } from '../repositories/sensorRepository';
import { sensorAnomalyService, AnomalyResult } from '../services/sensorAnomalyService';
import { logger } from '../utils/logger';

export interface InternalSensorEvent {
  site_id: string;
  sensor_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
  anomaly: AnomalyResult;
}

export class MQTTConsumer extends EventEmitter {
  private client: MqttClient | null = null;

  start(): void {
    this.client = mqttClientManager.connect();

    this.client.on('connect', () => {
      this.client?.subscribe(SENSOR_TOPIC_WILDCARD, { qos: 1 }, (err) => {
        if (err) {
          logger.error({ err: err.message, topic: SENSOR_TOPIC_WILDCARD }, 'Failed to subscribe to MQTT sensor topic');
        } else {
          logger.info({ topic: SENSOR_TOPIC_WILDCARD }, '📡 Subscribed to MQTT sensor telemetry topic');
        }
      });
    });

    this.client.on('message', async (topic: string, payloadBuffer: Buffer) => {
      await this.processMessage(topic, payloadBuffer);
    });
  }

  async processMessage(topic: string, payloadBuffer: Buffer): Promise<boolean> {
    const rawMessage = payloadBuffer.toString('utf-8');

    // 1. Topic Verification
    const parsedTopic = parseSensorTopic(topic);
    if (!parsedTopic) {
      logger.warn({ topic }, 'Received MQTT message on non-standard topic. Skipping.');
      return false;
    }

    // 2. JSON Parsing
    let rawJson: any;
    try {
      rawJson = JSON.parse(rawMessage);
    } catch {
      logger.warn({ topic, rawMessage }, 'Malformed JSON received over MQTT. Rejecting message.');
      return false;
    }

    // 3. Schema & Bound Validation
    const validation = sensorPayloadSchema.safeParse(rawJson);
    if (!validation.success) {
      logger.warn(
        { topic, errors: validation.error.format(), rawJson },
        'MQTT message failed schema/range validation. Rejecting.'
      );
      return false;
    }

    const payload: ValidatedSensorPayload = validation.data;

    // 4. Site Existence & Resolution
    try {
      const resolvedSiteId = await sensorRepository.resolveSiteId(payload.site_id);
      if (!resolvedSiteId) {
        logger.warn(
          { site_id: payload.site_id, topic },
          'Sensor reading references unknown site_id. Rejecting.'
        );
        return false;
      }

      // 5. Sensor Anomaly Detection
      const anomaly = sensorAnomalyService.evaluate(
        payload.sensor_type,
        payload.value,
        payload.unit
      );

      // 6. Persistence to PostgreSQL
      const persisted = await sensorRepository.createReading({
        site_id: resolvedSiteId,
        sensor_id: payload.sensor_id,
        sensor_type: payload.sensor_type,
        value: payload.value,
        unit: payload.unit,
        timestamp: payload.timestamp,
      });

      // 7. Structured Event Logging
      if (anomaly.is_anomaly) {
        logger.warn(
          {
            site_id: payload.site_id,
            sensor_id: payload.sensor_id,
            sensor_type: payload.sensor_type,
            value: payload.value,
            unit: payload.unit,
            reason: anomaly.reason,
            timestamp: payload.timestamp,
          },
          '⚠️ ANOMALOUS SENSOR READING DETECTED'
        );
      } else {
        logger.info(
          {
            site_id: payload.site_id,
            sensor_id: payload.sensor_id,
            sensor_type: payload.sensor_type,
            value: payload.value,
            unit: payload.unit,
            timestamp: payload.timestamp,
          },
          'Persisted normal sensor telemetry reading'
        );
      }

      // 8. Internal Event Dispatching
      const sensorEvent: InternalSensorEvent = {
        site_id: payload.site_id,
        sensor_id: payload.sensor_id,
        sensor_type: payload.sensor_type,
        value: payload.value,
        unit: payload.unit,
        timestamp: payload.timestamp,
        anomaly,
      };

      this.emit('sensor:reading', sensorEvent);
      if (anomaly.is_anomaly) {
        this.emit('sensor:anomaly', sensorEvent);
        try {
          const { broadcastSensorAnomaly } = await import('../websocket/socketServer');
          broadcastSensorAnomaly(sensorEvent);
        } catch {
          // Socket might not be initialized during isolated tests
        }
      }

      return true;
    } catch (err: any) {
      logger.error(
        { err: err.message, site_id: payload.site_id, topic },
        'Database error persisting MQTT sensor reading'
      );
      return false;
    }
  }
}

export const mqttConsumer = new MQTTConsumer();
