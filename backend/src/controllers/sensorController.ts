import { Request, Response, NextFunction } from 'express';
import { sensorService } from '../services/sensorService';
import { sendSuccess, sendError } from '../utils/response';

export const getRecentSensorReadings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const query = {
      sensorType: req.query.sensor_type as string | undefined,
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await sensorService.getRecentReadings(id, query);
    if (!result) {
      sendError(res, 'NOT_FOUND', `Site '${id}' not found`, 404);
      return;
    }

    sendSuccess(res, result.readings);
  } catch (err) {
    next(err);
  }
};

export const getLatestSensorReadings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await sensorService.getLatestReadings(id);
    if (!result) {
      sendError(res, 'NOT_FOUND', `Site '${id}' not found`, 404);
      return;
    }

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};
