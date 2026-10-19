import { api } from './api';
import { RiskEvent } from '../types';

export const riskService = {
  async getRiskEvents(filters?: { siteId?: string; riskLevel?: string; limit?: number }): Promise<RiskEvent[]> {
    const res = await api.get('/risk-events', { params: filters });
    return res.data.data;
  },

  async getRiskEventById(id: string): Promise<RiskEvent> {
    const res = await api.get(`/risk-events/${id}`);
    return res.data.data;
  },

  async analyzeRisk(payload: Record<string, unknown>): Promise<any> {
    const res = await api.post('/risk/analyze', payload);
    return res.data.risk;
  },
};
