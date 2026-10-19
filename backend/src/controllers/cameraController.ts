import { Request, Response, NextFunction } from 'express';
import { cameraService } from '../services/cameraService';
import { sendSuccess, sendError } from '../utils/response';

export const getCameras = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const siteId = req.query.site_id as string | undefined;
    const cameras = await cameraService.getAllCameras(siteId);
    sendSuccess(res, cameras);
  } catch (err) {
    next(err);
  }
};

export const getCameraById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const camera = await cameraService.getCameraById(id);
    if (!camera) {
      sendError(res, 'NOT_FOUND', `Camera with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, camera);
  } catch (err) {
    next(err);
  }
};

export const createCamera = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const camera = await cameraService.createCamera(req.body);
    sendSuccess(res, camera, 201, 'Camera created successfully');
  } catch (err) {
    next(err);
  }
};

