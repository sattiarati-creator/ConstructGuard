import request from 'supertest';
import { app } from '../../src/server';
import { pool } from '../../src/config/database';
import { hashPassword } from '../../src/auth/password';
import { signAccessToken } from '../../src/auth/jwt';

describe('Authentication API Integration Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUserRow = {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    name: 'Inspector Sharma',
    email: 'inspector@constructguard.local',
    password_hash: '', // will populate in beforeEach
    role: 'INSPECTOR',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  beforeAll(async () => {
    mockUserRow.password_hash = await hashPassword('Inspector@123');
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock findByEmail returns null (not exists)
      (jest.spyOn(pool, 'query') as any)
        .mockResolvedValueOnce({ rows: [] }) // findByEmail
        .mockResolvedValueOnce({ rows: [mockUserRow] }) // createUser
        .mockResolvedValueOnce({ rows: [{ id: 'audit-1' }] }) // audit log
        .mockResolvedValueOnce({ rows: [{ id: 'token-1' }] }); // refresh token

      const res = await request(app).post('/api/auth/register').send({
        name: 'New Officer',
        email: 'officer@constructguard.local',
        password: 'SecurePassword@123',
        role: 'INSPECTOR',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('inspector@constructguard.local');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should fail with 409 when user already exists', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValueOnce({
        rows: [mockUserRow],
      });

      const res = await request(app).post('/api/auth/register').send({
        name: 'Inspector Sharma',
        email: 'inspector@constructguard.local',
        password: 'Password@123',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('USER_ALREADY_EXISTS');
    });

    it('should fail with 400 when password is too short', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Inspector Sharma',
        email: 'inspector@constructguard.local',
        password: '123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in with valid credentials', async () => {
      (jest.spyOn(pool, 'query') as any)
        .mockResolvedValueOnce({ rows: [mockUserRow] }) // findByEmail
        .mockResolvedValueOnce({ rows: [{ id: 'token-1' }] }) // store refresh token
        .mockResolvedValueOnce({ rows: [{ id: 'audit-1' }] }); // audit log

      const res = await request(app).post('/api/auth/login').send({
        email: 'inspector@constructguard.local',
        password: 'Inspector@123',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('inspector@constructguard.local');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should reject with 401 on incorrect password', async () => {
      (jest.spyOn(pool, 'query') as any).mockResolvedValueOnce({
        rows: [mockUserRow],
      });

      const res = await request(app).post('/api/auth/login').send({
        email: 'inspector@constructguard.local',
        password: 'WrongPassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when bearer token is provided', async () => {
      const token = signAccessToken({
        userId: mockUserRow.id,
        email: mockUserRow.email,
        role: 'INSPECTOR',
        name: mockUserRow.name,
      });

      (jest.spyOn(pool, 'query') as any).mockResolvedValueOnce({
        rows: [mockUserRow],
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(mockUserRow.id);
      expect(res.body.data.email).toBe(mockUserRow.email);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
