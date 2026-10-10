import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config/env';
import { logger } from './utils/logger';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';
import { swaggerRouter } from './routes/swagger';
import { apiLimiter } from './middleware/rateLimiter';
import { initWebSocket } from './websocket/socketServer';
import { closeDatabasePool, checkDatabaseHealth } from './config/database';
import { checkRedisHealth, closeRedis } from './config/redis';
import { workerManager } from './workers';
import { mqttConsumer, mqttClientManager } from './mqtt';

const app = express();
const server = http.createServer(app);

// Ensure local uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Security and standard middlewares
app.use(helmet({ contentSecurityPolicy: false })); // allow swagger-ui and dashboard rendering
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Static file serving for development uploads
app.use('/uploads', express.static(config.uploadDir));

// OpenAPI / Swagger Documentation
app.use('/api-docs', swaggerRouter);

// Apply rate limiting to all API endpoints in development and production
if (process.env.NODE_ENV !== 'test') {
  app.use(config.apiPrefix, apiLimiter);
}

// Mount core API router under configured prefix (/api)
app.use(config.apiPrefix, apiRouter);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ConstructGuard Core API Service',
    description: 'Smart Unauthorized Construction Monitoring and Risk Intelligence System',
    disclaimer: 'ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection. The system provides decision support, not legal enforcement.',
    status: 'online',
    health: `${config.apiPrefix}/health`,
    docs: '/api-docs',
  });
});


// 404 and Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// Server startup function
const startServer = async () => {
  const PORT = config.port;
  
  // Test database connection on startup
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.isHealthy) {
    logger.info(`Database connected successfully (latency: ${dbHealth.latencyMs}ms)`);
  } else {
    logger.warn({ error: dbHealth.error }, 'PostgreSQL connection failed at startup. Will retry on request.');
  }

  // Test Redis & start BullMQ workers
  const redisHealth = await checkRedisHealth();
  if (redisHealth.status === 'connected') {
    logger.info(`Redis connected successfully (${config.redis.host}:${config.redis.port})`);
    workerManager.start();
  } else {
    logger.warn({ error: redisHealth.error }, 'Redis is offline at startup. BullMQ workers will retry connecting.');
  }

  // Start MQTT consumer to ingest site sensor telemetry
  try {
    mqttConsumer.start();
    logger.info('MQTT consumer started listening for telemetry.');
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to start MQTT consumer at server startup.');
  }

  // Initialize real-time WebSockets
  initWebSocket(server);
  logger.info('WebSocket server initialized.');

  server.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
    logger.info(`API Base URL: http://localhost:${PORT}${config.apiPrefix}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await workerManager.stop();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error stopping BullMQ workers');
    }
    try {
      await closeRedis();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error disconnecting Redis client');
    }
    try {
      await mqttClientManager.disconnect();
    } catch (err: any) {
      logger.error({ error: err.message }, 'Error disconnecting MQTT client');
    }
    await closeDatabasePool();
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, server };
