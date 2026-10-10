import { userRepository } from '../repositories/userRepository';
import { refreshTokenRepository } from '../repositories/refreshTokenRepository';
import { hashPassword, comparePassword } from '../auth/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from '../auth/jwt';
import { auditService } from './auditService';
import { UserRole, JwtUserPayload } from '../models';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  async register(dto: RegisterDTO, creatorUserId?: string) {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) {
      throw new Error('USER_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(dto.password);
    const role: UserRole = dto.role || 'VIEWER';

    const user = await userRepository.createUser({
      name: dto.name,
      email: dto.email,
      password_hash: passwordHash,
      role,
    });

    await auditService.log({
      userId: creatorUserId || user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token in database (valid for 7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken(user.id, hashToken(refreshToken), expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    };
  }

  async login(dto: LoginDTO, clientIp?: string) {
    const user = await userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(dto.password, user.password_hash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    const payload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Store hashed refresh token in database (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken(user.id, hashToken(refreshToken), expiresAt);

    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      metadata: { ip: clientIp, email: user.email },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '15m',
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtUserPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('INVALID_REFRESH_TOKEN');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await refreshTokenRepository.findValidToken(tokenHash);
    if (!stored) {
      throw new Error('TOKEN_REVOKED_OR_EXPIRED');
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // Refresh token rotation: revoke used token, issue new pair
    await refreshTokenRepository.revokeToken(tokenHash);

    const newPayload: JwtUserPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await refreshTokenRepository.createToken(user.id, hashToken(newRefreshToken), expiresAt);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '15m',
    };
  }

  async logout(refreshToken?: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await refreshTokenRepository.revokeToken(tokenHash);
    }
    if (userId) {
      await auditService.log({
        userId,
        action: 'USER_LOGOUT',
        entityType: 'USER',
        entityId: userId,
      });
    }
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };
  }
}

export const authService = new AuthService();
