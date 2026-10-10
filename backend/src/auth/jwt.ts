import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import { JwtUserPayload } from '../models';

export const signAccessToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry as any,
  });
};

export const signRefreshToken = (payload: JwtUserPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry as any,
  });
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtUserPayload;
};

export const verifyRefreshToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtUserPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
