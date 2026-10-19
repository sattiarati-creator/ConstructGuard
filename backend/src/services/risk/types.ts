export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ComponentScores {
  visual: number;
  change: number;
  sensor: number;
  time: number;
  permit: number;
}

export interface DetectedObject {
  class: string;
  confidence: number;
  boundingBox?: any;
}

export interface SensorAnomalyEvidence {
  sensorType: string;
  value: number;
  unit: string;
  isAnomaly: boolean;
  reason?: string;
}

export interface ImageChangeEvidence {
  changePercentage: number;
  changeType?: string;
  changedRegions?: any[];
}

export interface PermitSchedule {
  authorized: boolean;
  permitStartDate?: string | null;
  permitEndDate?: string | null;
  permittedStartTime?: string | null;
  permittedEndTime?: string | null;
}

export interface RiskEngineInput {
  siteId: string;
  visualScore?: number;
  changeScore?: number;
  sensorScore?: number;
  timeScore?: number;
  permitScore?: number;
  detectedObjects?: DetectedObject[];
  sensorAnomalies?: Record<string, SensorAnomalyEvidence>;
  imageChangePercentage?: number;
  currentTime?: Date | string;
  permitInformation?: PermitSchedule;
  [key: string]: any;
}

export interface RiskAnalysisResult {
  overallScore: number;
  riskLevel: RiskLevel;
  componentScores: ComponentScores;
  explanation: string;
  indicators: string[];
}
