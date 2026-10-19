import { riskRepository } from '../repositories/riskRepository';
import { RiskEvent } from '../models';

export class RiskService {
  async getAllRiskEvents(): Promise<RiskEvent[]> {
    return riskRepository.findAll();
  }

  async getRiskEventById(id: string): Promise<RiskEvent | null> {
    return riskRepository.findById(id);
  }
}

export const riskService = new RiskService();
