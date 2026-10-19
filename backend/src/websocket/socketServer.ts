import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { logger } from '../utils/logger';

let io: Server | null = null;

export const initWebSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`);

    socket.on('join:site', (siteId: string) => {
      socket.join(`site:${siteId}`);
      logger.info(`Socket ${socket.id} joined room site:${siteId}`);
    });

    socket.on('leave:site', (siteId: string) => {
      socket.leave(`site:${siteId}`);
      logger.info(`Socket ${socket.id} left room site:${siteId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
};

export const broadcastAlert = (alert: unknown): void => {
  if (io) {
    io.emit('alert.created', alert);
    io.emit('alert:created', alert);
  }
};

export const broadcastAlertAcknowledged = (alert: unknown): void => {
  if (io) {
    io.emit('alert.acknowledged', alert);
    io.emit('alert:acknowledged', alert);
  }
};

export const broadcastAlertResolved = (alert: unknown): void => {
  if (io) {
    io.emit('alert.resolved', alert);
    io.emit('alert:resolved', alert);
  }
};

export const broadcastRiskCreated = (riskEvent: unknown): void => {
  if (io) {
    io.emit('risk.created', riskEvent);
    io.emit('risk:created', riskEvent);
  }
};

export const broadcastRiskUpdated = (riskEvent: unknown): void => {
  if (io) {
    io.emit('risk.updated', riskEvent);
    io.emit('risk:updated', riskEvent);
  }
};

export const broadcastSensorAnomaly = (reading: unknown): void => {
  if (io) {
    io.emit('sensor.anomaly', reading);
    io.emit('sensor:anomaly', reading);
  }
};

