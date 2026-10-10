import { auditRepository } from '../repositories/auditRepository';
import { logger } from '../utils/logger';

export class AuditService {
  async log(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await auditRepository.createLog({
        user_id: data.userId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId,
        metadata: data.metadata,
      });
    } catch (err: any) {
      // Safe fallback: audit logging failure should not crash core operation, but record error
      logger.error({ error: err.message, action: data.action }, 'Failed to write audit log');
    }
  }

  async getLogs(limit = 50, offset = 0) {
    return auditRepository.getRecentLogs(limit, offset);
  }
}

export const auditService = new AuditService();
