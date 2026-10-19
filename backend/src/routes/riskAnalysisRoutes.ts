import { Router } from 'express';
import { analyzeRisk } from '../controllers/riskController';
import { validateBody } from '../middleware/validate';
import { riskAnalyzeSchema } from '../utils/schemas';

export const riskAnalysisRouter = Router();

// POST /api/risk/analyze
riskAnalysisRouter.post('/analyze', validateBody(riskAnalyzeSchema), analyzeRisk);
