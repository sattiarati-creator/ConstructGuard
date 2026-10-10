import { Router } from 'express';
import { getDashboardSummary, getRiskTrends, getSiteSummary } from '../controllers/dashboardController';
import { optionalAuth } from '../middleware/auth';

export const dashboardRouter = Router();

dashboardRouter.get('/summary', optionalAuth, getDashboardSummary);
dashboardRouter.get('/risk-trends', optionalAuth, getRiskTrends);
dashboardRouter.get('/site-summary', optionalAuth, getSiteSummary);
