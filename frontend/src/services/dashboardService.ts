import { api } from './api';
import { DashboardSummary, RiskTrendItem, SiteSummaryItem } from '../types';

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const res = await api.get('/dashboard/summary');
    return res.data.data;
  },

  async getRiskTrends(days = 7): Promise<RiskTrendItem[]> {
    const res = await api.get('/dashboard/risk-trends', { params: { days } });
    return res.data.data;
  },

  async getSiteSummary(): Promise<SiteSummaryItem[]> {
    const res = await api.get('/dashboard/site-summary');
    return res.data.data;
  },

  async getSiteSummaries(): Promise<SiteSummaryItem[]> {
    return this.getSiteSummary();
  },
};
