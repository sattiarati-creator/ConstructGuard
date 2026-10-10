import { pool } from '../config/database';
import { Alert } from '../models';

export class AlertRepository {
  async findAll(filters?: {
    severity?: string;
    status?: string;
    siteId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Alert[]> {
    let query = `
      SELECT a.id, a.risk_event_id, a.severity, a.status, a.acknowledged_by, a.acknowledged_at, a.resolved_at, a.created_at,
             s.name AS site_name, s.id AS site_id, r.overall_score AS risk_score, r.risk_level, r.explanation
      FROM alerts a
      JOIN risk_events r ON a.risk_event_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.severity) {
      query += ` AND a.severity = $${paramIndex++}`;
      params.push(filters.severity);
    }
    if (filters?.status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(filters.status);
    }
    if (filters?.siteId) {
      query += ` AND s.id = $${paramIndex++}`;
      params.push(filters.siteId);
    }

    query += `
      ORDER BY 
        CASE a.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
          ELSE 5
        END ASC,
        a.created_at DESC
    `;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }
    if (filters?.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows.map((row) => ({
      ...row,
      risk_score: row.risk_score ? parseFloat(row.risk_score) : undefined,
    }));
  }

  async findById(id: string): Promise<Alert | null> {
    const query = `
      SELECT a.id, a.risk_event_id, a.severity, a.status, a.acknowledged_by, a.acknowledged_at, a.resolved_at, a.created_at,
             s.name AS site_name, s.id AS site_id, r.overall_score AS risk_score, r.risk_level, r.explanation
      FROM alerts a
      JOIN risk_events r ON a.risk_event_id = r.id
      JOIN sites s ON r.site_id = s.id
      WHERE a.id = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      risk_score: row.risk_score ? parseFloat(row.risk_score) : undefined,
    };
  }

  async findByRiskEventId(riskEventId: string): Promise<Alert | null> {
    const query = `
      SELECT id, risk_event_id, severity, status, acknowledged_by, acknowledged_at, resolved_at, created_at
      FROM alerts
      WHERE risk_event_id = $1
      LIMIT 1;
    `;
    const result = await pool.query(query, [riskEventId]);
    return result.rows[0] || null;
  }

  async acknowledge(id: string, userId?: string | null): Promise<Alert | null> {
    const query = `
      UPDATE alerts
      SET status = 'ACKNOWLEDGED',
          acknowledged_by = $2,
          acknowledged_at = NOW()
      WHERE id = $1
      RETURNING id, risk_event_id, severity, status, acknowledged_by, acknowledged_at, resolved_at, created_at;
    `;
    const result = await pool.query(query, [id, userId || null]);
    if (result.rows.length === 0) return null;
    return this.findById(id);
  }

  async resolve(id: string): Promise<Alert | null> {
    const query = `
      UPDATE alerts
      SET status = 'RESOLVED',
          resolved_at = NOW()
      WHERE id = $1
      RETURNING id, risk_event_id, severity, status, acknowledged_by, acknowledged_at, resolved_at, created_at;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.findById(id);
  }

  async countOpen(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM alerts WHERE status = 'OPEN';");
    return result.rows[0].count;
  }

  async countCritical(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM alerts WHERE severity = 'CRITICAL' AND status = 'OPEN';");
    return result.rows[0].count;
  }

  async create(data: { risk_event_id: string; severity: string; status?: string }): Promise<Alert> {
    const query = `
      INSERT INTO alerts (risk_event_id, severity, status)
      VALUES ($1, $2, $3)
      RETURNING id, risk_event_id, severity, status, acknowledged_by, acknowledged_at, created_at;
    `;
    const result = await pool.query(query, [
      data.risk_event_id,
      data.severity,
      data.status || 'OPEN',
    ]);
    return result.rows[0];
  }
}

export const alertRepository = new AlertRepository();
