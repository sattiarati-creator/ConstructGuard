import { pool } from '../config/database';
import { Camera } from '../models';

export class CameraRepository {
  async findAll(siteId?: string): Promise<Camera[]> {
    let query = `
      SELECT id, site_id, name, stream_url, status, last_seen_at, created_at
      FROM cameras
    `;
    const params: any[] = [];
    if (siteId) {
      query += ' WHERE site_id = $1';
      params.push(siteId);
    }
    query += ' ORDER BY created_at ASC;';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id: string): Promise<Camera | null> {
    const query = `
      SELECT id, site_id, name, stream_url, status, last_seen_at, created_at
      FROM cameras
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return result.rows[0];
  }

  async create(data: {
    site_id: string;
    name: string;
    stream_url: string;
    status?: 'ONLINE' | 'OFFLINE';
  }): Promise<Camera> {
    const query = `
      INSERT INTO cameras (site_id, name, stream_url, status, last_seen_at)
      VALUES ($1, $2, $3, COALESCE($4, 'ONLINE'), NOW())
      RETURNING id, site_id, name, stream_url, status, last_seen_at, created_at;
    `;
    const result = await pool.query(query, [
      data.site_id,
      data.name,
      data.stream_url,
      data.status ?? 'ONLINE',
    ]);
    return result.rows[0];
  }

  async countActive(): Promise<number> {
    const result = await pool.query("SELECT COUNT(*)::int AS count FROM cameras WHERE status = 'ONLINE';");
    return result.rows[0].count;
  }
}

export const cameraRepository = new CameraRepository();
