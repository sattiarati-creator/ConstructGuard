import { Router } from 'express';
import { getAlerts, getAlertById, acknowledgeAlert, resolveAlert } from '../controllers/alertController';
import { validateParams, validateQuery } from '../middleware/validate';
import { idParamSchema, alertFilterSchema } from '../utils/schemas';
import { optionalAuth } from '../middleware/auth';

export const alertRouter = Router();

alertRouter.get('/', optionalAuth, validateQuery(alertFilterSchema), getAlerts);
alertRouter.get('/:id', optionalAuth, validateParams(idParamSchema), getAlertById);
alertRouter.post('/:id/acknowledge', optionalAuth, validateParams(idParamSchema), acknowledgeAlert);
alertRouter.post('/:id/resolve', optionalAuth, validateParams(idParamSchema), resolveAlert);
