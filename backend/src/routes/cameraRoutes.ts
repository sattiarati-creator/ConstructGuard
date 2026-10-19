import { Router } from 'express';
import { getCameras, getCameraById, createCamera } from '../controllers/cameraController';
import { validateParams, validateBody } from '../middleware/validate';
import { idParamSchema, createCameraSchema } from '../utils/schemas';
import { optionalAuth } from '../middleware/auth';

export const cameraRouter = Router();

cameraRouter.get('/', optionalAuth, getCameras);
cameraRouter.get('/:id', optionalAuth, validateParams(idParamSchema), getCameraById);
cameraRouter.post('/', optionalAuth, validateBody(createCameraSchema), createCamera);
