import mqtt, { MqttClient } from 'mqtt';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class MQTTClientManager {
  private client: MqttClient | null = null;
  private isConnected: boolean = false;
  private reconnectCount: number = 0;

  connect(): MqttClient {
    if (this.client) {
      return this.client;
    }

    const brokerUrl = `mqtt://${config.mqtt.host}:${config.mqtt.port}`;
    logger.info({ broker: brokerUrl, clientId: config.mqtt.clientId }, 'Initializing MQTT client connection...');

    this.client = mqtt.connect(brokerUrl, {
      clientId: `${config.mqtt.clientId}-${Math.random().toString(16).substring(2, 8)}`,
      username: config.mqtt.username || undefined,
      password: config.mqtt.password || undefined,
      reconnectPeriod: 3000, // Attempt reconnection every 3s
      connectTimeout: 5000,
      clean: true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.reconnectCount = 0;
      logger.info({ broker: brokerUrl }, '✅ Connected successfully to MQTT broker');
    });

    this.client.on('reconnect', () => {
      this.reconnectCount += 1;
      logger.warn({ attempt: this.reconnectCount }, '🔄 Reconnecting to MQTT broker...');
    });

    this.client.on('close', () => {
      if (this.isConnected) {
        logger.warn('MQTT connection closed. Will retry automatically.');
      }
      this.isConnected = false;
    });

    this.client.on('offline', () => {
      this.isConnected = false;
      logger.warn('MQTT client went offline');
    });

    this.client.on('error', (err: Error) => {
      logger.error({ err: err.message }, 'MQTT client encountered error');
    });

    return this.client;
  }

  getClient(): MqttClient | null {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  getHealthStatus(): { status: 'connected' | 'disconnected'; broker: string } {
    return {
      status: this.isConnected ? 'connected' : 'disconnected',
      broker: `${config.mqtt.host}:${config.mqtt.port}`,
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      return new Promise<void>((resolve) => {
        this.client?.end(false, () => {
          logger.info('MQTT client disconnected cleanly.');
          this.isConnected = false;
          this.client = null;
          resolve();
        });
      });
    }
  }
}

export const mqttClientManager = new MQTTClientManager();
