import { api } from './api';
import { Camera } from '../types';

export const cameraService = {
  async getCameras(siteId?: string): Promise<Camera[]> {
    const res = await api.get('/cameras', { params: siteId ? { site_id: siteId } : undefined });
    return res.data.data;
  },

  async getCameraById(id: string): Promise<Camera> {
    const res = await api.get(`/cameras/${id}`);
    return res.data.data;
  },

  async createCamera(data: { site_id: string; name: string; stream_url: string }): Promise<Camera> {
    const res = await api.post('/cameras', data);
    return res.data.data;
  },
};
