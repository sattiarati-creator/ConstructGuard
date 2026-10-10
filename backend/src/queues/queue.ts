import { Queue, QueueOptions, JobsOptions } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { config } from '../config/env';

export const IMAGE_PROCESSING_QUEUE_NAME = 'image-processing';
export const RISK_ANALYSIS_QUEUE_NAME = 'risk-analysis';
export const ALERT_PROCESSING_QUEUE_NAME = 'alert-processing';

export const defaultJobOptions: JobsOptions = {
  attempts: config.queue.retryAttempts,
  backoff: {
    type: 'exponential',
    delay: config.queue.backoffMs,
  },
  removeOnComplete: {
    count: 1000,
  },
  removeOnFail: {
    count: 5000,
  },
};

export const createQueue = <T = any>(queueName: string, customOptions?: Partial<QueueOptions>): Queue<T> => {
  return new Queue<T>(queueName, {
    connection: redisConnectionOptions,
    defaultJobOptions,
    ...customOptions,
  });
};
