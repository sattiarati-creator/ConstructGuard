import { Router } from 'express';
import { healthRouter } from './healthRoutes';
import { siteRouter } from './siteRoutes';
import { cameraRouter } from './cameraRoutes';
import { alertRouter } from './alertRoutes';
import { riskRouter } from './riskRoutes';
import { riskAnalysisRouter } from './riskAnalysisRoutes';
import { jobRouter } from './jobRoutes';
import { dashboardRouter } from './dashboardRoutes';
import { authRouter } from './authRoutes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/health', healthRouter);
apiRouter.use('/sites', siteRouter);
apiRouter.use('/cameras', cameraRouter);
apiRouter.use('/alerts', alertRouter);
apiRouter.use('/risk', riskAnalysisRouter);
apiRouter.use('/risk-events', riskRouter);
apiRouter.use('/jobs', jobRouter);
apiRouter.use('/dashboard', dashboardRouter);

