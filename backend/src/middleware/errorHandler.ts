import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendError } from '../utils/response';
import { config } from '../config/env';

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  logger.error({ err, path: req.path, method: req.method }, 'Request processing error');

  // Handle explicitly created Not Found errors
  if (err instanceof NotFoundError || err.name === 'NotFoundError') {
    sendError(res, 'NOT_FOUND', err.message, 404);
    return;
  }

  // Handle PostgreSQL database errors
  if (err.code && typeof err.code === 'string') {
    // Unique violation (e.g., duplicate email, duplicate image hash)
    if (err.code === '23505') {
      sendError(res, 'CONFLICT', 'A record with this unique identifier already exists', 409, {
        detail: err.detail,
      });
      return;
    }
    // Foreign key violation
    if (err.code === '23503') {
      sendError(res, 'FOREIGN_KEY_VIOLATION', 'Referenced foreign entity does not exist', 400, {
        detail: err.detail,
      });
      return;
    }
    // Check constraint violation
    if (err.code === '23514') {
      sendError(res, 'CONSTRAINT_VIOLATION', 'Check constraint violated', 400, {
        detail: err.detail,
      });
      return;
    }

    sendError(res, 'DATABASE_ERROR', 'A database error occurred', 500);
    return;
  }

  // Generic/Internal error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const details = config.env !== 'production' ? { stack: err.stack } : undefined;
  sendError(res, 'INTERNAL_ERROR', message, statusCode, details);
};
