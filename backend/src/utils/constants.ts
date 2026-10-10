export const QUEUES = {
  IMAGE_PROCESSING: 'image-processing',
  RISK_ANALYSIS: 'risk-analysis',
  ALERT_PROCESSING: 'alert-processing',
} as const;

export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;

export const SENSOR_TYPES = {
  VIBRATION: 'vibration',
  NOISE: 'noise',
  MOTION: 'motion',
  TEMPERATURE: 'temperature',
  DUST: 'dust',
} as const;
