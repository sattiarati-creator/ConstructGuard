import { api } from './api';
import { User } from '../types';

export const authService = {
  async login(credentials: { email: string; password: string }) {
    const res = await api.post('/auth/login', credentials);
    return res.data.data;
  },

  async register(data: { name: string; email: string; password: string; role?: string }) {
    const res = await api.post('/auth/register', data);
    return res.data.data;
  },

  async logout() {
    const refreshToken = localStorage.getItem('cg_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } finally {
      localStorage.removeItem('cg_access_token');
      localStorage.removeItem('cg_refresh_token');
      localStorage.removeItem('cg_user');
    }
  },

  async getMe(): Promise<User> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },
};
