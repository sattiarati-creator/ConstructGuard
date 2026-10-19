import { z } from 'zod';

export const ALLOWED_SENSOR_TYPES = [
  'vibration',
  'noise',
  'motion',
  'temperature',
  'dust',
] as const;

export type AllowedSensorType = (typeof ALLOWED_SENSOR_TYPES)[number];

// Range validation helpers for sanity checking
const isValueWithinSensorBounds = (type: AllowedSensorType, val: number): boolean => {
  switch (type) {
    case 'vibration':
      return val >= 0.0 && val <= 10.0; // g-force
    case 'noise':
      return val >= 0.0 && val <= 200.0; // decibels
    case 'motion':
      return val === 0.0 || val === 1.0; // binary state (0=idle, 1=motion)
    case 'temperature':
      return val >= -50.0 && val <= 150.0; // Celsius
    case 'dust':
      return val >= 0.0 && val <= 1000.0; // ug/m3 PM10
    default:
      return false;
  }
};

export const sensorPayloadSchema = z
  .object({
    site_id: z.string({ required_error: 'site_id is required' }).trim().min(1, 'site_id cannot be empty'),
    sensor_id: z.string({ required_error: 'sensor_id is required' }).trim().min(1, 'sensor_id cannot be empty'),
    sensor_type: z.enum(ALLOWED_SENSOR_TYPES, {
      errorMap: () => ({ message: `sensor_type must be one of: ${ALLOWED_SENSOR_TYPES.join(', ')}` }),
    }),
    value: z.number({ required_error: 'value must be a numeric reading' }).finite(),
    unit: z.string({ required_error: 'unit is required' }).trim().min(1, 'unit cannot be empty'),
    timestamp: z
      .string({ required_error: 'timestamp is required' })
      .datetime({ message: 'timestamp must be a valid ISO-8601 string' }),
  })
  .refine((data) => isValueWithinSensorBounds(data.sensor_type, data.value), {
    message: 'Value is outside reasonable physical sensor measurement boundaries',
    path: ['value'],
  });

export type ValidatedSensorPayload = z.infer<typeof sensorPayloadSchema>;
