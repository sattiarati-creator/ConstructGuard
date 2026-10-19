import { alertRepository } from '../repositories/alertRepository';
import { Alert } from '../models';
import {
  broadcastAlert,
  broadcastAlertAcknowledged,
  broadcastAlertResolved,
} from '../websocket/socketServer';
import { auditService } from './auditService';
import { logger } from '../utils/logger';

export class AlertService {
  async getAllAlerts(filters?: {
    severity?: string;
    status?: string;
    siteId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    return alertRepository.findAll(filters);
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return alertRepository.findById(id);
  }

  async createAlert(data: {
    risk_event_id: string;
    severity: string;
    status?: string;
  }): Promise<Alert | null> {
    // Prevent duplicate alerts for the same risk event
    const existing = await alertRepository.findByRiskEventId(data.risk_event_id);
    if (existing) {
      logger.info(
        { riskEventId: data.risk_event_id, alertId: existing.id },
        'Alert already exists for this risk event; skipping duplicate creation.'
      );
      return existing;
    }

    const created = await alertRepository.create(data);
    const hydrated = (await alertRepository.findById(created.id)) || created;

    // Real-time broadcast
    broadcastAlert(hydrated);

    await auditService.log({
      action: 'ALERT_CREATED',
      entityType: 'ALERT',
      entityId: created.id,
      metadata: { severity: data.severity, risk_event_id: data.risk_event_id },
    });

    return hydrated;
  }

  async acknowledgeAlert(id: string, userId?: string): Promise<Alert | null> {
    const alert = await alertRepository.acknowledge(id, userId);
    if (alert) {
      broadcastAlertAcknowledged(alert);
      await auditService.log({
        userId,
        action: 'ALERT_ACKNOWLEDGED',
        entityType: 'ALERT',
        entityId: id,
      });
    }
    return alert;
  }

  async resolveAlert(id: string, userId?: string): Promise<Alert | null> {
    const alert = await alertRepository.resolve(id);
    if (alert) {
      broadcastAlertResolved(alert);
      await auditService.log({
        userId,
        action: 'ALERT_RESOLVED',
        entityType: 'ALERT',
        entityId: id,
      });
    }
    return alert;
  }
}

export const alertService = new AlertService();

