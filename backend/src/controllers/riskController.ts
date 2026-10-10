import { Request, Response, NextFunction } from 'express';
import { riskEngine } from '../services/risk/riskEngine';
import { riskRepository } from '../repositories/riskRepository';
import { enqueueRiskAnalysis } from '../queues/riskAnalysisQueue';
import { sendSuccess } from '../utils/response';

export const analyzeRisk = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const evaluation = riskEngine.evaluate(req.body);

    res.status(200).json({
      success: true,
      risk: {
        overallScore: evaluation.overallScore,
        riskLevel: evaluation.riskLevel,
        componentScores: evaluation.componentScores,
        explanation: evaluation.explanation,
        indicators: evaluation.indicators,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getRiskEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { siteId, riskLevel, from, to, limit } = req.query;

    const events = await riskRepository.findAll({
      siteId: siteId as string | undefined,
      riskLevel: riskLevel as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    sendSuccess(res, events);
  } catch (err) {
    next(err);
  }
};

export const enqueueTestRiskJob = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const siteId = req.body.siteId || 'site-101';
    const job = await enqueueRiskAnalysis({
      siteId,
      visualScore: req.body.visualScore ?? 75,
      changeScore: req.body.changeScore ?? 80,
      sensorScore: req.body.sensorScore ?? 65,
      timeScore: req.body.timeScore ?? 80,
      permitScore: req.body.permitScore ?? 50,
      currentTime: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      jobId: job.id,
      queue: 'risk-analysis',
    });
  } catch (err) {
    next(err);
  }
};

export const getRiskEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await riskRepository.findById(id);
    if (!event) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Risk event '${id}' not found`,
        },
      });
      return;
    }
    sendSuccess(res, event);
  } catch (err) {
    next(err);
  }
};
