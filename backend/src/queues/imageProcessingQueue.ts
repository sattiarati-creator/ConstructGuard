import { Queue, Job, JobsOptions } from 'bullmq';
import { createQueue, IMAGE_PROCESSING_QUEUE_NAME } from './queue';
import { logger } from '../utils/logger';

export interface ImageProcessingJobData {
  imageId: string;
  siteId: string;
  cameraId?: string;
  storagePath: string;
  previousImageId?: string;
  capturedAt: string;
}

export const imageProcessingQueue: Queue<ImageProcessingJobData> = createQueue<ImageProcessingJobData>(
  IMAGE_PROCESSING_QUEUE_NAME
);

export const enqueueImageProcessing = async (
  data: ImageProcessingJobData,
  customOptions?: JobsOptions
): Promise<Job<ImageProcessingJobData>> => {
  // Deterministic job ID for idempotency: prevents processing the same image twice
  const jobId = `img-${data.siteId}-${data.imageId}`;

  const job = await imageProcessingQueue.add(
    'process-image',
    data,
    {
      jobId,
      ...customOptions,
    }
  );

  logger.info(
    { jobId: job.id, imageId: data.imageId, siteId: data.siteId },
    'Enqueued image-processing job'
  );

  return job;
};
