import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService';
import { sendSuccess } from '../utils/response';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const summary = await dashboardService.getSummary();
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
};

export const getRiskTrends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
    const trends = await dashboardService.getRiskTrends(days);
    sendSuccess(res, trends);
  } catch (err) {
    next(err);
  }
};

export const getSiteSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const siteSummary = await dashboardService.getSiteSummary();
    sendSuccess(res, siteSummary);
  } catch (err) {
    next(err);
  }
};

