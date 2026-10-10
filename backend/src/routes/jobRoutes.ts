import { Router } from 'express';
import { enqueueTestRiskJob } from '../controllers/riskController';

export const jobRouter = Router();

jobRouter.post('/test-risk', enqueueTestRiskJob);
