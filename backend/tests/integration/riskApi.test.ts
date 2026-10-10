import request from 'supertest';
import { app } from '../../src/server';
import { pool } from '../../src/config/database';
import * as redisModule from '../../src/config/redis';
import * as riskQueueModule from '../../src/queues/riskAnalysisQueue';

describe('Risk Analysis and Queue API Integration Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/risk/analyze', () => {
    it('should calculate and return structured risk analysis for valid input', async () => {
      const payload = {
        siteId: 'site-101',
        visualScore: 70,
        changeScore: 80,
        sensorScore: 60,
        timeScore: 80,
        permitScore: 50,
      };

      const res = await request(app).post('/api/risk/analyze').send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.risk).toBeDefined();
      expect(res.body.risk.overallScore).toBe(69.5);
      expect(res.body.risk.riskLevel).toBe('HIGH');
      expect(res.body.risk.componentScores).toEqual({
        visual: 70,
        change: 80,
        sensor: 60,
        time: 80,
        permit: 50,
      });
      expect(typeof res.body.risk.explanation).toBe('string');
      expect(Array.isArray(res.body.risk.indicators)).toBe(true);
    });

    it('should fail with 400 VALIDATION_ERROR when siteId is missing', async () => {
      const invalidPayload = {
        visualScore: 70,
      };

      const res = await request(app).post('/api/risk/analyze').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should fail with 400 VALIDATION_ERROR when scores exceed 100', async () => {
      const invalidPayload = {
        siteId: 'site-101',
        visualScore: 150,
      };

      const res = await request(app).post('/api/risk/analyze').send(invalidPayload);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/risk-events', () => {
    it('should return list of risk events with query filters', async () => {
      const mockEvents = [
        {
          id: 'e1a2b3c4-0001-4000-8000-000000000001',
          site_id: 'b2c3d4e5-0002-4000-8000-000000000101',
          visual_score: '75.00',
          change_score: '80.00',
          sensor_score: '65.00',
          time_score: '80.00',
          permit_score: '50.00',
          overall_score: '71.75',
          risk_level: 'HIGH',
          explanation: 'HIGH risk assessment because significant image change occurred.',
          indicators: ['HIGH_IMAGE_CHANGE', 'VIBRATION_ANOMALY'],
          created_at: new Date().toISOString(),
          site_name: 'Site 101 - Metro Rail Extension',
        },
      ];

      (jest.spyOn(pool, 'query') as any).mockResolvedValue({ rows: mockEvents });

      const res = await request(app).get('/api/risk-events?riskLevel=HIGH&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].risk_level).toBe('HIGH');
      expect(res.body.data[0].overall_score).toBe(71.75);
    });
  });

  describe('POST /api/jobs/test-risk', () => {
    it('should enqueue a test risk-analysis job into BullMQ', async () => {
      jest.spyOn(riskQueueModule, 'enqueueRiskAnalysis').mockResolvedValue({
        id: 'job-test-999',
      } as any);

      const res = await request(app).post('/api/jobs/test-risk').send({
        siteId: 'site-101',
        visualScore: 80,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.jobId).toBe('job-test-999');
      expect(res.body.queue).toBe('risk-analysis');
    });
  });

  describe('GET /api/health (Phase 4 multi-service status)', () => {
    it('should report database, redis, and mqtt connection states', async () => {
      const mockRelease = jest.fn();
      (jest.spyOn(pool, 'connect') as any).mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
        release: mockRelease,
      });

      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValue({
        status: 'connected',
        host: 'localhost',
        port: 6379,
        latencyMs: 2,
      });

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.database).toBe('connected');
      expect(res.body.data.redis).toBe('connected');
      expect(res.body.data.mqtt).toBeDefined();
    });

    it('should report degraded status without crashing when Redis is disconnected', async () => {
      const mockRelease = jest.fn();
      (jest.spyOn(pool, 'connect') as any).mockResolvedValue({
        query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
        release: mockRelease,
      });

      jest.spyOn(redisModule, 'checkRedisHealth').mockResolvedValue({
        status: 'disconnected',
        host: 'localhost',
        port: 6379,
        error: 'ECONNREFUSED',
      });

      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('degraded');
      expect(res.body.data.redis).toBe('disconnected');
    });
  });
});
