import { sensorRepository, SensorQueryParams } from '../repositories/sensorRepository';
import { SensorReading } from '../models';

export interface LatestSensorsResponse {
  siteId: string;
  sensors: Record<
    string,
    {
      value: number;
      unit: string;
      timestamp: Date;
      sensor_id?: string | null;
    }
  >;
}

export class SensorService {
  async getRecentReadings(
    siteIdentifier: string,
    params: SensorQueryParams
  ): Promise<{ siteId: string; readings: SensorReading[] } | null> {
    const resolvedSiteId = await sensorRepository.resolveSiteId(siteIdentifier);
    if (!resolvedSiteId) return null;

    const readings = await sensorRepository.findBySite(resolvedSiteId, params);
    return {
      siteId: siteIdentifier,
      readings,
    };
  }

  async getLatestReadings(siteIdentifier: string): Promise<LatestSensorsResponse | null> {
    const resolvedSiteId = await sensorRepository.resolveSiteId(siteIdentifier);
    if (!resolvedSiteId) return null;

    const sensors = await sensorRepository.findLatestBySite(resolvedSiteId);
    return {
      siteId: siteIdentifier,
      sensors,
    };
  }
}

export const sensorService = new SensorService();
