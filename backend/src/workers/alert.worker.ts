import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { config } from '../config/env';
import { ALERT_PROCESSING_QUEUE_NAME } from '../queues/queue';
import { AlertJobData } from '../queues/alertQueue';
import { alertService } from '../services/alertService';
import { logger } from '../utils/logger';

export const createAlertWorker = (): Worker<AlertJobData> => {
  const worker = new Worker<AlertJobData>(
    ALERT_PROCESSING_QUEUE_NAME,
    async (job: Job<AlertJobData>) => {
      const startTime = Date.now();
      const { riskEventId, siteId, severity, score } = job.data;

      logger.info(
        {
          jobId: job.id,
          jobType: 'alert-processing',
          riskEventId,
          siteId,
          severity,
          score,
          attempt: job.attemptsMade + 1,
          status: 'started',
        },
        'Starting alert creation job'
      );

      try {
        const alert = await alertService.createAlert({
          risk_event_id: riskEventId,
          severity,
          status: 'OPEN',
        });

        const duration = Date.now() - startTime;
        const alertId = alert ? alert.id : 'duplicate-skipped';
        logger.info(
          {
            event: 'alert_created',
            jobId: job.id,
            alertId,
            riskEventId,
            siteId,
            severity,
            durationMs: duration,
            status: 'completed',
          },
          'Created operator alert in database'
        );

        return { alertId, created: Boolean(alert), duration };
      } catch (err: any) {
        const duration = Date.now() - startTime;
        logger.error(
          {
            jobId: job.id,
            jobType: 'alert-processing',
            riskEventId,
            siteId,
            attempt: job.attemptsMade + 1,
            duration,
            error: err.message,
            status: 'failed',
          },
          'Alert creation worker failed'
        );
        throw err;
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: config.queue.concurrency,
    }
  );

  return worker;
};
