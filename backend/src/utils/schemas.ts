import { z } from 'zod';
import { ALLOWED_SENSOR_TYPES } from '../mqtt/validation';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

export const createSiteSchema = z.object({
  name: z.string({ required_error: 'Site name is required' }).trim().min(1, 'Site name cannot be empty'),
  latitude: z.number({ required_error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number({ required_error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  address: z.string({ required_error: 'Address is required' }).trim().min(1, 'Address cannot be empty'),
  authorized: z.boolean().optional().default(true),
  permit_number: z.string().trim().optional().nullable(),
  permit_start_date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD').nullable().optional(),
  permit_end_date: z.string().regex(dateRegex, 'Date must be formatted as YYYY-MM-DD').nullable().optional(),
  permitted_start_time: z.string().regex(timeRegex, 'Time must be formatted as HH:MM or HH:MM:SS').nullable().optional(),
  permitted_end_time: z.string().regex(timeRegex, 'Time must be formatted as HH:MM or HH:MM:SS').nullable().optional(),
});

export const updateSiteSchema = createSiteSchema.partial();

export const createCameraSchema = z.object({
  site_id: z.string().uuid('Invalid site_id UUID'),
  name: z.string().trim().min(1, 'Camera name cannot be empty'),
  stream_url: z.string().trim().min(1, 'stream_url cannot be empty'),
  status: z.enum(['ONLINE', 'OFFLINE']).optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'INSPECTOR', 'VIEWER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password cannot be empty'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const alertFilterSchema = z.object({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  siteId: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(200))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid UUID identifier format'),
});

export const siteIdentifierParamSchema = z.object({
  id: z.string().trim().min(1, 'Site identifier cannot be empty'),
});

export const sensorQuerySchema = z.object({
  sensor_type: z.enum(ALLOWED_SENSOR_TYPES).optional(),
  from: z.string().datetime({ message: 'from must be a valid ISO-8601 timestamp' }).optional(),
  to: z.string().datetime({ message: 'to must be a valid ISO-8601 timestamp' }).optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1, 'Limit must be at least 1').max(500, 'Limit cannot exceed 500'))
    .optional(),
});

export const riskAnalyzeSchema = z.object({
  siteId: z.string({ required_error: 'siteId is required' }).trim().min(1, 'siteId cannot be empty'),
  visualScore: z.number().min(0, 'visualScore must be >= 0').max(100, 'visualScore must be <= 100').optional(),
  changeScore: z.number().min(0, 'changeScore must be >= 0').max(100, 'changeScore must be <= 100').optional(),
  sensorScore: z.number().min(0, 'sensorScore must be >= 0').max(100, 'sensorScore must be <= 100').optional(),
  timeScore: z.number().min(0, 'timeScore must be >= 0').max(100, 'timeScore must be <= 100').optional(),
  permitScore: z.number().min(0, 'permitScore must be >= 0').max(100, 'permitScore must be <= 100').optional(),
  detectedObjects: z.array(
    z.object({
      class: z.string(),
      confidence: z.number().min(0).max(1),
      boundingBox: z.any().optional(),
    })
  ).optional(),
  imageChangePercentage: z.number().min(0).max(100).optional(),
  sensorAnomalies: z.record(z.any()).optional(),
  currentTime: z.string().optional(),
});

export const riskEventQuerySchema = z.object({
  siteId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(200))
    .optional(),
});
