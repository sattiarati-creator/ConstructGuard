import { pool } from '../config/database';
import { RefreshToken } from '../models';

export class RefreshTokenRepository {
  async createToken(userId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const res = await pool.query<RefreshToken>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at`,
      [userId, tokenHash, expiresAt]
    );
    return res.rows[0];
  }

  async findValidToken(tokenHash: string): Promise<RefreshToken | null> {
    const res = await pool.query<RefreshToken>(
      `SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
       FROM refresh_tokens
       WHERE token_hash = $1
         AND revoked_at IS NULL
         AND expires_at > NOW()`,
      [tokenHash]
    );
    return res.rows[0] || null;
  }

  async revokeToken(tokenHash: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(
      `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
