import { hashPassword, comparePassword } from '../../src/auth/password';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
} from '../../src/auth/jwt';
import { requireRole } from '../../src/middleware/auth';
import { JwtUserPayload } from '../../src/models';

describe('Authentication and RBAC Unit Tests', () => {
  describe('Password Hashing Utility', () => {
    it('should hash a password and verify it correctly using bcrypt', async () => {
      const plain = 'StrongPassword@2026';
      const hash = await hashPassword(plain);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(plain);
      expect(hash.startsWith('$2b$10$')).toBe(true);

      const isValid = await comparePassword(plain, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Token Service', () => {
    const mockUser: JwtUserPayload = {
      userId: 'a1b2c3d4-0001-4000-8000-000000000001',
      email: 'inspector@constructguard.local',
      role: 'INSPECTOR',
      name: 'Inspector Sharma',
    };

    it('should sign and verify valid access tokens', () => {
      const token = signAccessToken(mockUser);
      expect(typeof token).toBe('string');

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(mockUser.userId);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe('INSPECTOR');
    });

    it('should sign and verify valid refresh tokens', () => {
      const token = signRefreshToken(mockUser);
      expect(typeof token).toBe('string');

      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(mockUser.userId);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should deterministically generate SHA256 hash of tokens for DB storage', () => {
      const token = 'sample-jwt-token-string';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string length
    });

    it('should reject invalid or tampered tokens', () => {
      expect(() => verifyAccessToken('invalid.token.payload')).toThrow();
    });
  });

  describe('RBAC Middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let nextFn: jest.Mock;

    beforeEach(() => {
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      nextFn = jest.fn();
    });

    it('should allow access when user role matches allowed roles', () => {
      mockReq.user = { role: 'ADMIN' };
      const middleware = requireRole(['ADMIN', 'INSPECTOR']);

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should reject with 403 FORBIDDEN when user role is not permitted', () => {
      mockReq.user = { role: 'VIEWER' };
      const middleware = requireRole(['ADMIN', 'INSPECTOR']);

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('should reject with 401 UNAUTHORIZED when no user is attached to request', () => {
      mockReq.user = undefined;
      const middleware = requireRole(['ADMIN']);

      middleware(mockReq, mockRes, nextFn);
      expect(nextFn).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});
