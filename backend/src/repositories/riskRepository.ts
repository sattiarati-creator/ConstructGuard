import { pool } from '../config/database';
import { RiskEvent } from '../models';

export interface CreateRiskEventDto {
  site_id: string;
  image_id?: string | null;
  visual_score: number;
  change_score: number;
  sensor_score: number;
  time_score: number;
  permit_score: number;
  overall_score: number;
  risk_level: string;
  explanation: string;
  indicators?: string[];
}

export interface RiskEventFilters {
  siteId?: string;
  riskLevel?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export class RiskRepository {
  async create(data: CreateRiskEventDto): Promise<RiskEvent> {
    const query = `
      INSERT INTO risk_events (
        site_id,
        image_id,
        visual_score,
        change_score,
        sensor_score,
        time_score,
        permit_score,
        overall_score,
        risk_level,
        explanation,
        indicators
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id,
        site_id,
        image_id,
        visual_score,
        change_score,
        sensor_score,
        time_score,
        permit_score,
        overall_score,
        risk_level,
        explanation,
        indicators,
        created_at
    `;

    const values = [
      data.site_id,
      data.image_id || null,
      data.visual_score,
      data.change_score,
      data.sensor_score,
      data.time_score,
      data.permit_score,
      data.overall_score,
      data.risk_level,
      data.explanation,
      JSON.stringify(data.indicators || []),
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];
    return this.mapRowToModel(row);
  }

  async findAll(filters: RiskEventFilters = {}): Promise<RiskEvent[]> {
    let query = `
      SELECT 
        r.id,
        r.site_id,
        r.image_id,
        r.visual_score,
        r.change_score,
        r.sensor_score,
        r.time_score,
        r.permit_score,
        r.overall_score,
        r.risk_level,
        r.explanation,
        r.indicators,
        r.created_at,
        s.name AS site_name
      FROM risk_events r
      LEFT JOIN sites s ON r.site_id = s.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (filters.siteId) {
      // Support matching UUID or sites.code
      query += ` AND (r.site_id = $${paramIndex} OR s.code = $${paramIndex})`;
      params.push(filters.siteId);
      paramIndex++;
    }

    if (filters.riskLevel) {
      query += ` AND r.risk_level = $${paramIndex}`;
      params.push(filters.riskLevel.toUpperCase());
      paramIndex++;
    }

    if (filters.from) {
      query += ` AND r.created_at >= $${paramIndex}`;
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      query += ` AND r.created_at <= $${paramIndex}`;
      params.push(filters.to);
      paramIndex++;
    }

    query += ` ORDER BY r.created_at DESC`;

    const limit = Math.min(filters.limit || 50, 200);
    query += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map((row) => this.mapRowToModel(row));
  }

  async findById(id: string): Promise<RiskEvent | null> {
    const query = `
      SELECT 
        r.id,
        r.site_id,
        r.image_id,
        r.visual_score,
        r.change_score,
        r.sensor_score,
        r.time_score,
        r.permit_score,
        r.overall_score,
        r.risk_level,
        r.explanation,
        r.indicators,
        r.created_at,
        s.name AS site_name
      FROM risk_events r
      LEFT JOIN sites s ON r.site_id = s.id
      WHERE r.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToModel(result.rows[0]);
  }

  async countTodayEvents(): Promise<number> {
    const result = await pool.query(
      "SELECT COUNT(*)::int AS count FROM risk_events WHERE created_at >= CURRENT_DATE;"
    );
    return result.rows[0].count;
  }

  async getDailyTrends(days = 7): Promise<Array<{ date: string; avgScore: number; maxScore: number; count: number; highOrCritical: number }>> {
    const query = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        ROUND(AVG(overall_score)::numeric, 1) AS avg_score,
        ROUND(MAX(overall_score)::numeric, 1) AS max_score,
        COUNT(*)::int AS count,
        COUNT(CASE WHEN risk_level IN ('HIGH', 'CRITICAL') THEN 1 END)::int AS high_or_critical
      FROM risk_events
      WHERE created_at >= NOW() - ($1 || ' days')::interval
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
      ORDER BY date ASC;
    `;
    const res = await pool.query(query, [days]);
    return res.rows.map((r) => ({
      date: r.date,
      avgScore: parseFloat(r.avg_score) || 0,
      maxScore: parseFloat(r.max_score) || 0,
      count: r.count,
      highOrCritical: r.high_or_critical,
    }));
  }

  async getLatestRiskPerSite(): Promise<Array<{
    site_id: string;
    site_name: string;
    overall_score: number;
    risk_level: string;
    explanation: string;
    created_at: Date;
  }>> {
    const query = `
      SELECT DISTINCT ON (r.site_id)
        r.site_id,
        s.name AS site_name,
        r.overall_score,
        r.risk_level,
        r.explanation,
        r.created_at
      FROM risk_events r
      JOIN sites s ON r.site_id = s.id
      ORDER BY r.site_id, r.created_at DESC;
    `;
    const res = await pool.query(query);
    return res.rows.map((r) => ({
      site_id: r.site_id,
      site_name: r.site_name,
      overall_score: parseFloat(r.overall_score),
      risk_level: r.risk_level,
      explanation: r.explanation,
      created_at: r.created_at,
    }));
  }


  private mapRowToModel(row: any): RiskEvent {
    return {
      id: row.id,
      site_id: row.site_id,
      image_id: row.image_id || null,
      visual_score: parseFloat(row.visual_score),
      change_score: parseFloat(row.change_score),
      sensor_score: parseFloat(row.sensor_score),
      time_score: parseFloat(row.time_score),
      permit_score: parseFloat(row.permit_score),
      overall_score: parseFloat(row.overall_score),
      risk_level: row.risk_level,
      explanation: row.explanation,
      indicators: Array.isArray(row.indicators) ? row.indicators : (typeof row.indicators === 'string' ? JSON.parse(row.indicators) : []),
      created_at: row.created_at,
      site_name: row.site_name,
    };
  }
}

export const riskRepository = new RiskRepository();
