import { Worker } from 'bullmq';
import { createImageProcessingWorker } from './imageProcessing.worker';
import { createRiskAnalysisWorker } from './riskAnalysis.worker';
import { createAlertWorker } from './alert.worker';
import { logger } from '../utils/logger';

export class WorkerManager {
  private workers: Worker[] = [];
  private isRunning: boolean = false;

  start(): void {
    if (this.isRunning) return;

    try {
      logger.info('Initializing BullMQ distributed queue workers...');
      this.workers.push(createImageProcessingWorker());
      this.workers.push(createRiskAnalysisWorker());
      this.workers.push(createAlertWorker());
      this.isRunning = true;
      logger.info('All BullMQ workers initialized and listening for jobs.');
    } catch (err: any) {
      logger.warn({ error: err.message }, 'Failed to start BullMQ workers (Redis might be unavailable).');
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    logger.info('Stopping BullMQ workers gracefully...');
    await Promise.all(this.workers.map((w) => w.close()));
    this.workers = [];
    this.isRunning = false;
    logger.info('All BullMQ workers stopped cleanly.');
  }

  getWorkerCount(): number {
    return this.workers.length;
  }
}

export const workerManager = new WorkerManager();
export * from './imageProcessing.worker';
export * from './riskAnalysis.worker';
export * from './alert.worker';
