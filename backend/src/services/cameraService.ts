import { cameraRepository } from '../repositories/cameraRepository';
import { Camera } from '../models';

export class CameraService {
  async getAllCameras(siteId?: string): Promise<Camera[]> {
    return cameraRepository.findAll(siteId);
  }

  async getCameraById(id: string): Promise<Camera | null> {
    return cameraRepository.findById(id);
  }

  async createCamera(data: {
    site_id: string;
    name: string;
    stream_url: string;
    status?: 'ONLINE' | 'OFFLINE';
  }): Promise<Camera> {
    return cameraRepository.create(data);
  }
}

export const cameraService = new CameraService();
