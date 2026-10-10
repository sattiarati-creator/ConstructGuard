import { Request, Response } from 'express';
import { authService } from '../services/authService';
import { sendSuccess, sendError } from '../utils/response';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register(
      { name, email, password, role },
      req.user?.userId
    );
    sendSuccess(res, result, 201);
  } catch (err: any) {
    if (err.message === 'USER_ALREADY_EXISTS') {
      sendError(res, 'USER_ALREADY_EXISTS', 'A user with this email address already exists.', 409);
      return;
    }
    sendError(res, 'REGISTRATION_FAILED', err.message || 'User registration failed.', 400);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password }, req.ip);

    // Set secure HTTP-only refresh token cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, result, 200);
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password.', 401);
      return;
    }
    sendError(res, 'LOGIN_FAILED', err.message || 'Login failed.', 400);
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      sendError(res, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required.', 400);
      return;
    }

    const tokens = await authService.refresh(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, tokens, 200);
  } catch (err: any) {
    sendError(res, 'INVALID_REFRESH_TOKEN', err.message || 'Could not refresh token.', 401);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    await authService.logout(refreshToken, req.user?.userId);

    res.clearCookie('refreshToken');
    sendSuccess(res, { message: 'Logged out successfully.' }, 200);
  } catch (err: any) {
    sendError(res, 'LOGOUT_FAILED', err.message || 'Logout failed.', 400);
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendError(res, 'UNAUTHORIZED', 'Authentication required.', 401);
      return;
    }
    const user = await authService.getMe(req.user.userId);
    sendSuccess(res, user, 200);
  } catch (err: any) {
    sendError(res, 'USER_NOT_FOUND', err.message || 'User profile not found.', 404);
  }
};
