/**
 * Centralized MQTT Topic Builder and Parser
 * Structure: constructguard/sites/{site_id}/sensors/{sensor_type}
 */

export const MQTT_TOPIC_PREFIX = 'constructguard/sites';

export const SENSOR_TOPIC_WILDCARD = `${MQTT_TOPIC_PREFIX}/+/sensors/+`;

export const buildSensorTopic = (siteId: string, sensorType: string): string => {
  return `${MQTT_TOPIC_PREFIX}/${siteId}/sensors/${sensorType}`;
};

export interface ParsedSensorTopic {
  siteId: string;
  sensorType: string;
}

const TOPIC_REGEX = /^constructguard\/sites\/([^/]+)\/sensors\/([^/]+)$/;

export const parseSensorTopic = (topic: string): ParsedSensorTopic | null => {
  const match = topic.match(TOPIC_REGEX);
  if (!match) return null;
  return {
    siteId: match[1],
    sensorType: match[2],
  };
};
