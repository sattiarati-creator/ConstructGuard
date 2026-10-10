import { pool } from '../config/database';
import { AuditLog } from '../models';

export class AuditRepository {
  async createLog(data: {
    user_id?: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    const res = await pool.query<AuditLog>(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, action, entity_type, entity_id, metadata, created_at`,
      [
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        JSON.stringify(data.metadata || {}),
      ]
    );
    return res.rows[0];
  }

  async getRecentLogs(limit = 50, offset = 0): Promise<AuditLog[]> {
    const res = await pool.query<AuditLog>(
      `SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
              u.name as user_name, u.email as user_email, u.role as user_role
       FROM audit_logs a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }
}

export const auditRepository = new AuditRepository();
