import { Queue, Job, JobsOptions } from 'bullmq';
import { createQueue, ALERT_PROCESSING_QUEUE_NAME } from './queue';
import { logger } from '../utils/logger';

export interface AlertJobData {
  riskEventId: string;
  siteId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  explanation: string;
  indicators: string[];
}

export const alertQueue: Queue<AlertJobData> = createQueue<AlertJobData>(
  ALERT_PROCESSING_QUEUE_NAME
);

export const enqueueAlertProcessing = async (
  data: AlertJobData,
  customOptions?: JobsOptions
): Promise<Job<AlertJobData>> => {
  // Deterministic job ID for idempotency: prevents creating duplicate alerts for same risk event
  const jobId = `alert-${data.riskEventId}`;

  const job = await alertQueue.add(
    'process-alert',
    data,
    {
      jobId,
      ...customOptions,
    }
  );

  logger.info(
    { jobId: job.id, riskEventId: data.riskEventId, severity: data.severity },
    'Enqueued alert-processing job'
  );

  return job;
};
