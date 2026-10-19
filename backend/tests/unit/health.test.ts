import request from 'supertest';
import { app } from '../../src/server';
import { pool } from '../../src/config/database';

describe('Health & Root API Check', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('GET /api/health should return status ok when database is accessible', async () => {
    const mockRelease = jest.fn();
    (jest.spyOn(pool, 'connect') as any).mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      release: mockRelease,
    });

    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('ConstructGuard API is running');
    expect(res.body.data.database).toBe('connected');
    expect(res.body.data.redis).toBeDefined();
    expect(res.body.data.mqtt).toBeDefined();
  });

  it('GET / should return root service information', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('ConstructGuard Core API Service');
    expect(res.body.status).toBe('online');
  });
});
