import { Request, Response } from 'express';
import { checkDatabaseHealth } from '../config/database';
import { checkRedisHealth } from '../config/redis';
import { mqttClientManager } from '../mqtt/client';
import { sendSuccess, sendError } from '../utils/response';

export const getHealth = async (req: Request, res: Response): Promise<void> => {
  const [dbHealth, redisHealth] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);
  const mqttStatus = mqttClientManager.getHealthStatus();

  if (!dbHealth.isHealthy) {
    sendError(res, 'DATABASE_UNAVAILABLE', 'Database is not responding', 503, {
      status: 'unhealthy',
      database: 'disconnected',
      redis: redisHealth.status,
      mqtt: mqttStatus.status,
      error: dbHealth.error,
    });
    return;
  }

  const isDegraded = redisHealth.status !== 'connected' || mqttStatus.status !== 'connected';

  sendSuccess(
    res,
    {
      status: isDegraded ? 'degraded' : 'healthy',
      database: 'connected',
      redis: redisHealth.status,
      mqtt: mqttStatus.status,
      latencyMs: dbHealth.latencyMs,
      redisLatencyMs: redisHealth.latencyMs,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    200,
    'ConstructGuard API is running'
  );
};
