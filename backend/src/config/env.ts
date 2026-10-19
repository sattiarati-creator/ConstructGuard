import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/constructguard'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().transform((val) => parseInt(val, 10)).optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_SSL: z.string().transform((val) => val === 'true').default('false'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform((val) => parseInt(val, 10)).default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  QUEUE_RETRY_ATTEMPTS: z.string().transform((val) => parseInt(val, 10)).default('3'),
  QUEUE_BACKOFF_MS: z.string().transform((val) => parseInt(val, 10)).default('2000'),
  WORKER_CONCURRENCY: z.string().transform((val) => parseInt(val, 10)).default('3'),
  CV_SERVICE_URL: z.string().default('http://localhost:8000'),
  MQTT_HOST: z.string().default('localhost'),
  MQTT_PORT: z.string().transform((val) => parseInt(val, 10)).default('1883'),
  MQTT_USERNAME: z.string().optional(),
  MQTT_PASSWORD: z.string().optional(),
  MQTT_TOPIC_PREFIX: z.string().default('constructguard/sites'),
  MQTT_CLIENT_ID: z.string().default('constructguard-backend-consumer'),
  JWT_ACCESS_SECRET: z.string().default('constructguard-super-secret-access-token-key-2026'),
  JWT_REFRESH_SECRET: z.string().default('constructguard-super-secret-refresh-token-key-2026'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  DEMO_MODE: z.string().transform((val) => val === 'true').default('false'),
  UPLOAD_DIR: z.string().default(path.resolve(process.cwd(), 'uploads')),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Environment validation failed.');
}

export const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  corsOrigin: env.CORS_ORIGIN,
  databaseUrl: env.DATABASE_URL,
  cvServiceUrl: env.CV_SERVICE_URL,
  logLevel: env.LOG_LEVEL,
  demoMode: env.DEMO_MODE,
  uploadDir: env.UPLOAD_DIR,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiry: env.JWT_ACCESS_EXPIRY,
    refreshExpiry: env.JWT_REFRESH_EXPIRY,
  },
  db: {
    connectionString: env.DATABASE_URL,
    ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },
  queue: {
    retryAttempts: env.QUEUE_RETRY_ATTEMPTS,
    backoffMs: env.QUEUE_BACKOFF_MS,
    concurrency: env.WORKER_CONCURRENCY,
  },
  mqtt: {
    host: env.MQTT_HOST,
    port: env.MQTT_PORT,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD,
    topicPrefix: env.MQTT_TOPIC_PREFIX,
    clientId: env.MQTT_CLIENT_ID,
  },
};
