import Redis, { RedisOptions } from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

export interface RedisHealth {
  status: 'connected' | 'disconnected';
  host: string;
  port: number;
  latencyMs?: number;
  error?: string;
}

export const redisConnectionOptions: RedisOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
  connectTimeout: 1000,
  reconnectOnError: (err) => {
    if (process.env.NODE_ENV === 'test') return false;
    logger.warn({ err: err.message }, 'Redis reconnecting on error');
    return true;
  },
  retryStrategy: (times) => {
    if (process.env.NODE_ENV === 'test') {
      return null; // Do not endlessly retry in Jest unit tests
    }
    // Exponential reconnect with max 5s backoff
    const delay = Math.min(times * 500, 5000);
    return delay;
  },
  lazyConnect: true,
};

let redisClient: Redis | null = null;
let isConnected = false;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConnectionOptions);

    redisClient.on('connect', () => {
      isConnected = true;
      logger.info({ host: config.redis.host, port: config.redis.port }, 'Connected to Redis server');
    });

    redisClient.on('ready', () => {
      isConnected = true;
    });

    redisClient.on('close', () => {
      isConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        logger.warn('Redis connection closed');
      }
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      if (process.env.NODE_ENV !== 'test') {
        logger.error({ err: err.message }, 'Redis connection error');
      }
    });

    // Initiate connection asynchronously
    if (process.env.NODE_ENV !== 'test') {
      redisClient.connect().catch((err) => {
        logger.warn({ err: err.message }, 'Initial Redis connection attempt failed. Will retry in background.');
      });
    }
  }

  return redisClient;
};

export const checkRedisHealth = async (): Promise<RedisHealth> => {
  const client = getRedisClient();
  const start = Date.now();
  try {
    const pingPromise = client.ping();
    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Redis connection timed out')), 600)
    );

    const pong = await Promise.race([pingPromise, timeoutPromise]);
    const latencyMs = Date.now() - start;
    if (pong === 'PONG') {
      return {
        status: 'connected',
        host: config.redis.host,
        port: config.redis.port,
        latencyMs,
      };
    }
    return {
      status: 'disconnected',
      host: config.redis.host,
      port: config.redis.port,
      error: `Unexpected ping response: ${pong}`,
    };
  } catch (err: any) {
    return {
      status: 'disconnected',
      host: config.redis.host,
      port: config.redis.port,
      error: err.message || 'Could not reach Redis server',
    };
  }
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis client disconnected cleanly.');
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isConnected = false;
    }
  }
};
