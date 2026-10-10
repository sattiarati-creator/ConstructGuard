import { api } from './api';
import { SensorReading } from '../types';

export const sensorService = {
  async getSiteSensors(siteId: string, query?: { sensor_type?: string; limit?: number }): Promise<SensorReading[]> {
    const res = await api.get(`/sites/${siteId}/sensors`, { params: query });
    return res.data.data;
  },

  async getLatestSensors(siteId: string): Promise<{ site_id: string; sensors: Record<string, SensorReading> }> {
    const res = await api.get(`/sites/${siteId}/sensors/latest`);
    return res.data.data;
  },
};
