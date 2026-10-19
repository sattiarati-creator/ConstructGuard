import { Router } from 'express';
import { getSites, getSiteById, createSite, updateSite, deleteSite } from '../controllers/siteController';
import {
  getRecentSensorReadings,
  getLatestSensorReadings,
} from '../controllers/sensorController';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { optionalAuth } from '../middleware/auth';
import {
  createSiteSchema,
  updateSiteSchema,
  siteIdentifierParamSchema,
  sensorQuerySchema,
} from '../utils/schemas';

export const siteRouter = Router();

siteRouter.get('/', optionalAuth, getSites);
siteRouter.get('/:id', optionalAuth, validateParams(siteIdentifierParamSchema), getSiteById);
siteRouter.post('/', optionalAuth, validateBody(createSiteSchema), createSite);
siteRouter.put('/:id', optionalAuth, validateParams(siteIdentifierParamSchema), validateBody(updateSiteSchema), updateSite);
siteRouter.delete('/:id', optionalAuth, validateParams(siteIdentifierParamSchema), deleteSite);

// IoT Sensor Readings APIs
siteRouter.get(
  '/:id/sensors',
  validateParams(siteIdentifierParamSchema),
  validateQuery(sensorQuerySchema),
  getRecentSensorReadings
);

siteRouter.get(
  '/:id/sensors/latest',
  validateParams(siteIdentifierParamSchema),
  getLatestSensorReadings
);
