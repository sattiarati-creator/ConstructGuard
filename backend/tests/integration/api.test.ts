import request from 'supertest';
import { app } from '../../src/server';
import { pool } from '../../src/config/database';
import * as redisModule from '../../src/config/redis';

describe('ConstructGuard Phase 1 API Integration Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return 200 when database is healthy', async () => {
      const mockRelease = jest.fn();
      (jest.spyOn(pool, 'connect') as any).mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
        release: mockRelease,
      });
      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValue({
        status: 'connected',
        host: 'localhost',
        port: 6379,
      });

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('ConstructGuard API is running');
      expect(res.body.data.database).toBe('connected');
      expect(res.body.data.mqtt).toBeDefined();
    });

    it('should return 503 when database is disconnected', async () => {
      (jest.spyOn(pool, 'connect') as any).mockRejectedValue(new Error('Connection lost'));
      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValue({
        status: 'disconnected',
        host: 'localhost',
        port: 6379,
      });

      const res = await request(app).get('/api/health');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('DATABASE_UNAVAILABLE');
    });
  });

  describe('Sites API', () => {
    const sampleSite = {
      id: 'b2c3d4e5-0002-4000-8000-000000000101',
      name: 'Site 101 - Metro Rail Extension',
      latitude: '12.9715987',
      longitude: '77.5945627',
      address: 'Plot 12, MG Road Metro Corridor',
      authorized: true,
      permit_start_date: '2026-01-01',
      permit_end_date: '2026-12-31',
      permitted_start_time: '07:00:00',
      permitted_end_time: '18:00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    it('GET /api/sites should return a list of sites', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValue({
        rows: [sampleSite],
      });

      const res = await request(app).get('/api/sites');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe('Site 101 - Metro Rail Extension');
      expect(typeof res.body.data[0].latitude).toBe('number');
    });

    it('GET /api/sites/:id should return site details if found', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValue({
        rows: [sampleSite],
      });

      const res = await request(app).get(`/api/sites/${sampleSite.id}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(sampleSite.id);
    });

    it('GET /api/sites/:id should return 404 for non-existent site', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValue({
        rows: [],
      });

      const nonExistentId = '00000000-0000-4000-8000-000000000000';
      const res = await request(app).get(`/api/sites/${nonExistentId}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('POST /api/sites should create and return a site with valid payload', async () => {
      const newSitePayload = {
        name: 'Site 106 - Green Valley Heights',
        latitude: 12.92,
        longitude: 77.61,
        address: 'HSR Layout Sector 2, Bangalore',
        authorized: true,
        permit_start_date: '2026-05-01',
        permit_end_date: '2026-11-30',
        permitted_start_time: '08:00:00',
        permitted_end_time: '18:00:00',
      };

      (jest.spyOn(pool, 'query') as any).mockResolvedValue({
        rows: [
          {
            id: 'c4d5e6f7-0003-4000-8000-000000000106',
            ...newSitePayload,
            latitude: '12.92',
            longitude: '77.61',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app).post('/api/sites').send(newSitePayload);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(newSitePayload.name);
    });

    it('POST /api/sites should fail with 400 VALIDATION_ERROR when missing required fields or invalid latitude', async () => {
      const invalidPayload = {
        name: '',
        latitude: 195.5, // Invalid latitude (> 90)
        longitude: 77.5,
        // missing address
      };

      const res = await request(app).post('/api/sites').send(invalidPayload);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(Array.isArray(res.body.error.details)).toBe(true);
    });
  });

  describe('Sensors API (Phase 3)', () => {
    const siteId = 'b2c3d4e5-0002-4000-8000-000000000101';
    const mockReadings = [
      {
        id: '11111111-2222-3333-4444-555555555551',
        site_id: siteId,
        sensor_id: 'vib-101',
        sensor_type: 'vibration',
        value: '0.18',
        unit: 'g',
        timestamp: new Date().toISOString(),
      },
      {
        id: '11111111-2222-3333-4444-555555555552',
        site_id: siteId,
        sensor_id: 'noise-101',
        sensor_type: 'noise',
        value: '52.4',
        unit: 'dB',
        timestamp: new Date().toISOString(),
      },
    ];

    it('GET /api/sites/:id/sensors should return recent sensor readings', async () => {
      (jest.spyOn(pool, 'query') as any)
        .mockResolvedValueOnce({ rows: [{ id: siteId }] }) // resolve site
        .mockResolvedValueOnce({ rows: mockReadings }); // select readings

      const res = await request(app).get(`/api/sites/${siteId}/sensors?limit=10`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].value).toBe(0.18);
      expect(res.body.data[0].site_id).toBe(siteId);
    });

    it('GET /api/sites/:id/sensors should return 404 for unknown site', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValueOnce({ rows: [] });

      const res = await request(app).get('/api/sites/unknown-site-999/sensors');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('GET /api/sites/:id/sensors/latest should return latest reading per sensor type', async () => {
      (jest.spyOn(pool, 'query') as any)
        .mockResolvedValueOnce({ rows: [{ id: siteId }] }) // resolve site
        .mockResolvedValueOnce({ rows: mockReadings }); // select DISTINCT ON readings

      const res = await request(app).get(`/api/sites/${siteId}/sensors/latest`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sensors).toBeDefined();
      expect(res.body.data.sensors.vibration.value).toBe(0.18);
      expect(res.body.data.sensors.noise.value).toBe(52.4);
    });
  });

  describe('Alerts API', () => {
    it('GET /api/alerts should return alerts with joined risk data', async () => {
      const mockAlerts = [
        {
          id: 'f6a7b8c9-0006-4000-8000-000000000501',
          risk_event_id: 'e5f6a7b8-0005-4000-8000-000000000404',
          severity: 'CRITICAL',
          status: 'OPEN',
          site_name: 'Site 104 - Riverside Waterfront Villa',
          risk_score: '93.80',
          risk_level: 'CRITICAL',
          explanation: 'CRITICAL VIOLATION: Excavator and crane active on unauthorized site.',
          created_at: new Date().toISOString(),
        },
      ];

      (jest.spyOn(pool, 'query') as any).mockResolvedValue({ rows: mockAlerts });

      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].severity).toBe('CRITICAL');
      expect(res.body.data[0].risk_score).toBe(93.8);
    });
  });

  describe('Dashboard API', () => {
    it('GET /api/dashboard/summary should return aggregated system metrics', async () => {
      (jest.spyOn(pool, 'query') as any)
        .mockResolvedValueOnce({ rows: [{ count: 5 }] }) // sites
        .mockResolvedValueOnce({ rows: [{ count: 8 }] }) // cameras
        .mockResolvedValueOnce({ rows: [{ count: 2 }] }) // open alerts
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }) // critical alerts
        .mockResolvedValueOnce({ rows: [{ count: 7 }] }); // today events

      const res = await request(app).get('/api/dashboard/summary');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        totalSites: 5,
        activeCameras: 8,
        openAlerts: 2,
        criticalAlerts: 1,
        todayEvents: 7,
      });
    });
  });
});
