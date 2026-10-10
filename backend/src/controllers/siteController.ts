import { Request, Response, NextFunction } from 'express';
import { siteService } from '../services/siteService';
import { sendSuccess, sendError } from '../utils/response';

export const getSites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sites = await siteService.getAllSites();
    sendSuccess(res, sites);
  } catch (err) {
    next(err);
  }
};

export const getSiteById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const site = await siteService.getSiteById(id);
    if (!site) {
      sendError(res, 'NOT_FOUND', `Site with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, site);
  } catch (err) {
    next(err);
  }
};

export const createSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const site = await siteService.createSite(req.body, req.user?.userId);
    sendSuccess(res, site, 201, 'Site created successfully');
  } catch (err) {
    next(err);
  }
};

export const updateSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const site = await siteService.updateSite(id, req.body, req.user?.userId);
    if (!site) {
      sendError(res, 'NOT_FOUND', `Site with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, site, 200, 'Site updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteSite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const success = await siteService.deleteSite(id, req.user?.userId);
    if (!success) {
      sendError(res, 'NOT_FOUND', `Site with ID ${id} not found`, 404);
      return;
    }
    sendSuccess(res, { deleted: true }, 200, 'Site deleted successfully');
  } catch (err) {
    next(err);
  }
};

