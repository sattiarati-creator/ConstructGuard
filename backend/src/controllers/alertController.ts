import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alertService';
import { sendSuccess, sendError } from '../utils/response';

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { severity, status, siteId, limit, offset } = req.query as any;
    const alerts = await alertService.getAllAlerts({
      severity,
      status,
      siteId,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
};

export const getAlertById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertById(id);
    if (!alert) {
      sendError(res, 'NOT_FOUND', `Alert with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, alert);
  } catch (err) {
    next(err);
  }
};

export const acknowledgeAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await alertService.acknowledgeAlert(id, req.user?.userId);
    if (!alert) {
      sendError(res, 'NOT_FOUND', `Alert with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, alert, 200, 'Alert acknowledged successfully');
  } catch (err) {
    next(err);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await alertService.resolveAlert(id, req.user?.userId);
    if (!alert) {
      sendError(res, 'NOT_FOUND', `Alert with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, alert, 200, 'Alert marked as resolved');
  } catch (err) {
    next(err);
  }
};

