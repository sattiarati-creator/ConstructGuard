import { api } from './api';
import { Alert } from '../types';

export const alertService = {
  async getAlerts(filters?: { severity?: string; status?: string; siteId?: string; limit?: number }): Promise<Alert[]> {
    const res = await api.get('/alerts', { params: filters });
    return res.data.data;
  },

  async getAlertById(id: string): Promise<Alert> {
    const res = await api.get(`/alerts/${id}`);
    return res.data.data;
  },

  async acknowledgeAlert(id: string): Promise<Alert> {
    const res = await api.post(`/alerts/${id}/acknowledge`);
    return res.data.data;
  },

  async resolveAlert(id: string, notes?: string): Promise<Alert> {
    const res = await api.post(`/alerts/${id}/resolve`, { notes });
    return res.data.data;
  },
};
