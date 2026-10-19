import { Router } from 'express';
import { getRiskEvents, getRiskEventById } from '../controllers/riskController';
import { validateParams, validateQuery } from '../middleware/validate';
import { idParamSchema, riskEventQuerySchema } from '../utils/schemas';

export const riskRouter = Router();

// GET /api/risk-events
riskRouter.get('/', validateQuery(riskEventQuerySchema), getRiskEvents);

// GET /api/risk-events/:id
riskRouter.get('/:id', validateParams(idParamSchema), getRiskEventById);
