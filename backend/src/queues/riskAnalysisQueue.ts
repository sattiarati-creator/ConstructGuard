import { Queue, Job, JobsOptions } from 'bullmq';
import { createQueue, RISK_ANALYSIS_QUEUE_NAME } from './queue';
import { DetectedObject, SensorAnomalyEvidence } from '../services/risk/types';
import { logger } from '../utils/logger';

export interface RiskAnalysisJobData {
  siteId: string;
  imageId?: string;
  visualScore?: number;
  changeScore?: number;
  sensorScore?: number;
  timeScore?: number;
  permitScore?: number;
  detectedObjects?: DetectedObject[];
  sensorAnomalies?: Record<string, SensorAnomalyEvidence>;
  imageChangePercentage?: number;
  currentTime?: string;
}

export const riskAnalysisQueue: Queue<RiskAnalysisJobData> = createQueue<RiskAnalysisJobData>(
  RISK_ANALYSIS_QUEUE_NAME
);

export const enqueueRiskAnalysis = async (
  data: RiskAnalysisJobData,
  customOptions?: JobsOptions
): Promise<Job<RiskAnalysisJobData>> => {
  // Deterministic job ID for idempotency: prevents duplicate risk events
  const jobId = data.imageId
    ? `risk-${data.siteId}-${data.imageId}`
    : `risk-${data.siteId}-${Date.now()}`;

  const job = await riskAnalysisQueue.add(
    'analyze-risk',
    data,
    {
      jobId,
      ...customOptions,
    }
  );

  logger.info(
    { jobId: job.id, siteId: data.siteId, imageId: data.imageId },
    'Enqueued risk-analysis job'
  );

  return job;
};
