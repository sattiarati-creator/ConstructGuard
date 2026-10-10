import { pool } from '../config/database';
import { SensorReading, SensorType } from '../models';

export interface CreateSensorReadingDTO {
  site_id: string; // resolved UUID
  sensor_id?: string | null;
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: string | Date;
}

export interface SensorQueryParams {
  sensorType?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export class SensorRepository {
  /**
   * Resolves a site identifier (either UUID or code like 'site-101') to the database UUID.
   */
  async resolveSiteId(siteIdentifier: string): Promise<string | null> {
    const query = `
      SELECT id FROM sites
      WHERE id::text = $1 OR code = $1
      LIMIT 1;
    `;
    try {
      const result = await pool.query(query, [siteIdentifier]);
      if (result.rows.length === 0) return null;
      return result.rows[0].id;
    } catch {
      // If UUID parsing fails on id::text comparison or invalid input, attempt code match
      const fallback = await pool.query('SELECT id FROM sites WHERE code = $1 LIMIT 1;', [siteIdentifier]);
      if (fallback.rows.length === 0) return null;
      return fallback.rows[0].id;
    }
  }

  /**
   * Persists a validated sensor reading to PostgreSQL.
   */
  async createReading(data: CreateSensorReadingDTO): Promise<SensorReading> {
    const query = `
      INSERT INTO sensor_readings (site_id, sensor_id, sensor_type, value, unit, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, site_id, sensor_id, sensor_type, value, unit, timestamp;
    `;
    const values = [
      data.site_id,
      data.sensor_id || null,
      data.sensor_type,
      data.value,
      data.unit,
      data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp,
    ];

    const result = await pool.query(query, values);
    return this.mapRowToReading(result.rows[0]);
  }

  /**
   * Fetches recent readings for a site with optional sensor_type, date range, and limit.
   */
  async findBySite(siteId: string, params: SensorQueryParams): Promise<SensorReading[]> {
    let query = `
      SELECT id, site_id, sensor_id, sensor_type, value, unit, timestamp
      FROM sensor_readings
      WHERE site_id = $1
    `;
    const values: any[] = [siteId];
    let paramIndex = 2;

    if (params.sensorType) {
      query += ` AND sensor_type = $${paramIndex++}`;
      values.push(params.sensorType);
    }

    if (params.from) {
      query += ` AND timestamp >= $${paramIndex++}`;
      values.push(params.from);
    }

    if (params.to) {
      query += ` AND timestamp <= $${paramIndex++}`;
      values.push(params.to);
    }

    // High performance index-backed sort
    query += ` ORDER BY timestamp DESC`;

    const limit = Math.min(Math.max(params.limit || 50, 1), 500);
    query += ` LIMIT $${paramIndex++};`;
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows.map(this.mapRowToReading);
  }

  /**
   * Returns the single latest reading for each distinct sensor_type for a given site.
   * Utilizes PostgreSQL's optimized DISTINCT ON expression.
   */
  async findLatestBySite(siteId: string): Promise<Record<string, { value: number; unit: string; timestamp: Date; sensor_id?: string | null }>> {
    const query = `
      SELECT DISTINCT ON (sensor_type)
        sensor_type, value, unit, timestamp, sensor_id
      FROM sensor_readings
      WHERE site_id = $1
      ORDER BY sensor_type, timestamp DESC;
    `;
    const result = await pool.query(query, [siteId]);

    const latest: Record<string, { value: number; unit: string; timestamp: Date; sensor_id?: string | null }> = {};
    for (const row of result.rows) {
      latest[row.sensor_type] = {
        value: parseFloat(row.value),
        unit: row.unit,
        timestamp: row.timestamp,
        sensor_id: row.sensor_id,
      };
    }
    return latest;
  }

  private mapRowToReading(row: any): SensorReading {
    return {
      id: row.id,
      site_id: row.site_id,
      sensor_id: row.sensor_id,
      sensor_type: row.sensor_type,
      value: parseFloat(row.value),
      unit: row.unit,
      timestamp: row.timestamp,
    };
  }
}

export const sensorRepository = new SensorRepository();
