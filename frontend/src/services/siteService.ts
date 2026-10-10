import { api } from './api';
import { Site } from '../types';

export const siteService = {
  async getSites(): Promise<Site[]> {
    const res = await api.get('/sites');
    return res.data.data;
  },

  async getSiteById(id: string): Promise<Site> {
    const res = await api.get(`/sites/${id}`);
    return res.data.data;
  },

  async getSite(id: string): Promise<Site> {
    return this.getSiteById(id);
  },

  async getSiteSensors(siteId: string, limit = 50): Promise<any[]> {
    const res = await api.get(`/sites/${siteId}/sensors`, { params: { limit } });
    return res.data.data;
  },

  async createSite(data: Partial<Site>): Promise<Site> {
    const res = await api.post('/sites', data);
    return res.data.data;
  },

  async updateSite(id: string, data: Partial<Site>): Promise<Site> {
    const res = await api.put(`/sites/${id}`, data);
    return res.data.data;
  },

  async deleteSite(id: string): Promise<boolean> {
    const res = await api.delete(`/sites/${id}`);
    return res.data.success;
  },
};
