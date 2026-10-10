import { pool } from '../config/database';
import { Site } from '../models';

export interface CreateSiteDTO {
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  authorized?: boolean;
  permit_number?: string | null;
  permit_start_date?: string | null;
  permit_end_date?: string | null;
  permitted_start_time?: string | null;
  permitted_end_time?: string | null;
}

export class SiteRepository {
  async findAll(): Promise<Site[]> {
    const query = `
      SELECT id, code, name, latitude, longitude, address, authorized, permit_number,
             permit_start_date, permit_end_date, permitted_start_time, permitted_end_time,
             created_at, updated_at
      FROM sites
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query);
    return result.rows.map(this.mapRowToSite);
  }

  async findById(id: string): Promise<Site | null> {
    const query = `
      SELECT id, code, name, latitude, longitude, address, authorized, permit_number,
             permit_start_date, permit_end_date, permitted_start_time, permitted_end_time,
             created_at, updated_at
      FROM sites
      WHERE id = $1;
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToSite(result.rows[0]);
  }

  async findByCode(code: string): Promise<Site | null> {
    const query = `
      SELECT id, code, name, latitude, longitude, address, authorized, permit_number,
             permit_start_date, permit_end_date, permitted_start_time, permitted_end_time,
             created_at, updated_at
      FROM sites
      WHERE code = $1;
    `;
    const result = await pool.query(query, [code]);
    if (result.rows.length === 0) return null;
    return this.mapRowToSite(result.rows[0]);
  }

  async create(data: CreateSiteDTO): Promise<Site> {
    const query = `
      INSERT INTO sites (
        name, latitude, longitude, address, authorized, permit_number,
        permit_start_date, permit_end_date, permitted_start_time, permitted_end_time
      )
      VALUES ($1, $2, $3, $4, COALESCE($5, true), $6, $7, $8, $9, $10)
      RETURNING id, code, name, latitude, longitude, address, authorized, permit_number,
                permit_start_date, permit_end_date, permitted_start_time, permitted_end_time,
                created_at, updated_at;
    `;
    const values = [
      data.name,
      data.latitude,
      data.longitude,
      data.address,
      data.authorized ?? true,
      data.permit_number || null,
      data.permit_start_date || null,
      data.permit_end_date || null,
      data.permitted_start_time || null,
      data.permitted_end_time || null,
    ];
    const result = await pool.query(query, values);
    return this.mapRowToSite(result.rows[0]);
  }

  async update(id: string, data: Partial<CreateSiteDTO>): Promise<Site | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const query = `
      UPDATE sites
      SET name = COALESCE($1, name),
          latitude = COALESCE($2, latitude),
          longitude = COALESCE($3, longitude),
          address = COALESCE($4, address),
          authorized = COALESCE($5, authorized),
          permit_number = COALESCE($6, permit_number),
          permit_start_date = COALESCE($7, permit_start_date),
          permit_end_date = COALESCE($8, permit_end_date),
          permitted_start_time = COALESCE($9, permitted_start_time),
          permitted_end_time = COALESCE($10, permitted_end_time),
          updated_at = NOW()
      WHERE id = $11
      RETURNING id, code, name, latitude, longitude, address, authorized, permit_number,
                permit_start_date, permit_end_date, permitted_start_time, permitted_end_time,
                created_at, updated_at;
    `;
    const values = [
      data.name ?? null,
      data.latitude ?? null,
      data.longitude ?? null,
      data.address ?? null,
      data.authorized ?? null,
      data.permit_number ?? null,
      data.permit_start_date ?? null,
      data.permit_end_date ?? null,
      data.permitted_start_time ?? null,
      data.permitted_end_time ?? null,
      id,
    ];
    const result = await pool.query(query, values);
    return result.rows.length > 0 ? this.mapRowToSite(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM sites WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM sites;');
    return result.rows[0].count;
  }

  private mapRowToSite(row: any): Site {
    return {
      ...row,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
    };
  }
}

export const siteRepository = new SiteRepository();
