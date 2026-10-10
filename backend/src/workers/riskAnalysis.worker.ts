import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../config/redis';
import { config } from '../config/env';
import { RISK_ANALYSIS_QUEUE_NAME } from '../queues/queue';
import { RiskAnalysisJobData } from '../queues/riskAnalysisQueue';
import { enqueueAlertProcessing } from '../queues/alertQueue';
import { riskEngine } from '../services/risk/riskEngine';
import { siteRepository } from '../repositories/siteRepository';
import { sensorRepository } from '../repositories/sensorRepository';
import { sensorAnomalyService } from '../services/sensorAnomalyService';
import { riskRepository } from '../repositories/riskRepository';
import { SensorAnomalyEvidence } from '../services/risk/types';
import { logger } from '../utils/logger';

export const createRiskAnalysisWorker = (): Worker<RiskAnalysisJobData> => {
  const worker = new Worker<RiskAnalysisJobData>(
    RISK_ANALYSIS_QUEUE_NAME,
    async (job: Job<RiskAnalysisJobData>) => {
      const startTime = Date.now();
      const { siteId, imageId } = job.data;

      logger.info(
        {
          jobId: job.id,
          jobType: 'risk-analysis',
          siteId,
          imageId,
          attempt: job.attemptsMade + 1,
          status: 'started',
        },
        'Starting asynchronous risk evaluation job'
      );

      try {
        // 1. Resolve site information (supports UUID or code)
        const resolvedSiteId = await sensorRepository.resolveSiteId(siteId);
        const site = resolvedSiteId ? await siteRepository.findById(resolvedSiteId) : null;

        const permitInformation = site
          ? {
              authorized: site.authorized,
              permitStartDate: site.permit_start_date
                ? typeof site.permit_start_date === 'string'
                  ? site.permit_start_date
                  : (site.permit_start_date as any).toISOString()
                : null,
              permitEndDate: site.permit_end_date
                ? typeof site.permit_end_date === 'string'
                  ? site.permit_end_date
                  : (site.permit_end_date as any).toISOString()
                : null,
              permittedStartTime: site.permitted_start_time,
              permittedEndTime: site.permitted_end_time,
            }
          : undefined;

        // 2. Resolve sensor evidence if not passed explicitly in job
        let sensorAnomalies = job.data.sensorAnomalies;
        if (!sensorAnomalies && resolvedSiteId) {
          const latestReadings = await sensorRepository.findLatestBySite(resolvedSiteId);
          const entries = Object.entries(latestReadings);
          if (entries.length > 0) {
            sensorAnomalies = {};
            for (const [sensorType, r] of entries) {
              const anomaly = sensorAnomalyService.evaluate(
                sensorType as any,
                r.value,
                r.unit
              );
              sensorAnomalies[sensorType] = {
                sensorType,
                value: r.value,
                unit: r.unit,
                isAnomaly: anomaly.is_anomaly,
                reason: anomaly.reason,
              };
            }
          }
        }

        // 3. Execute pure risk engine evaluation
        const riskResult = riskEngine.evaluate({
          siteId,
          visualScore: job.data.visualScore,
          changeScore: job.data.changeScore,
          sensorScore: job.data.sensorScore,
          timeScore: job.data.timeScore,
          permitScore: job.data.permitScore,
          detectedObjects: job.data.detectedObjects,
          imageChangePercentage: job.data.imageChangePercentage,
          sensorAnomalies,
          currentTime: job.data.currentTime || new Date().toISOString(),
          permitInformation,
        });

        // 4. Persist to PostgreSQL risk_events table
        const persistedRiskEvent = await riskRepository.create({
          site_id: resolvedSiteId || siteId,
          image_id: imageId || null,
          visual_score: riskResult.componentScores.visual,
          change_score: riskResult.componentScores.change,
          sensor_score: riskResult.componentScores.sensor,
          time_score: riskResult.componentScores.time,
          permit_score: riskResult.componentScores.permit,
          overall_score: riskResult.overallScore,
          risk_level: riskResult.riskLevel,
          explanation: riskResult.explanation,
          indicators: riskResult.indicators,
        });

        // Broadcast risk event in real-time to dashboard
        try {
          const { broadcastRiskCreated } = await import('../websocket/socketServer');
          broadcastRiskCreated(persistedRiskEvent);
        } catch (wsErr: any) {
          logger.warn({ error: wsErr.message }, 'Could not broadcast risk event');
        }

        // 5. Enqueue Alert if Risk qualifies as HIGH or CRITICAL
        if (riskResult.riskLevel === 'HIGH' || riskResult.riskLevel === 'CRITICAL') {
          await enqueueAlertProcessing({
            riskEventId: persistedRiskEvent.id,
            siteId: resolvedSiteId || siteId,
            severity: riskResult.riskLevel,
            score: riskResult.overallScore,
            explanation: riskResult.explanation,
            indicators: riskResult.indicators,
          });
        }

        const duration = Date.now() - startTime;
        logger.info(
          {
            event: 'risk_analysis_completed',
            jobId: job.id,
            jobType: 'risk-analysis',
            siteId,
            imageId,
            riskEventId: persistedRiskEvent.id,
            overallScore: riskResult.overallScore,
            riskLevel: riskResult.riskLevel,
            durationMs: duration,
            status: 'completed',
          },
          'Risk analysis completed and persisted to PostgreSQL'
        );

        return {
          riskEventId: persistedRiskEvent.id,
          overallScore: riskResult.overallScore,
          riskLevel: riskResult.riskLevel,
          duration,
        };
      } catch (err: any) {
        const duration = Date.now() - startTime;
        logger.error(
          {
            jobId: job.id,
            jobType: 'risk-analysis',
            siteId,
            imageId,
            attempt: job.attemptsMade + 1,
            duration,
            error: err.message,
            status: 'failed',
          },
          'Risk analysis worker encountered error'
        );
        throw err; // BullMQ exponential retry
      }
    },
    {
      connection: redisConnectionOptions,
      concurrency: config.queue.concurrency,
    }
  );

  return worker;
};
