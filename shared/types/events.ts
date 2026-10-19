/**
 * ConstructGuard Shared Types & Data Contracts
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SensorType = 'vibration' | 'noise' | 'motion' | 'temperature' | 'dust';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'PENDING' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export type JobType = 'OBJECT_DETECTION' | 'CHANGE_DETECTION' | 'RISK_CALCULATION';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  class: string;
  confidence: number;
  bounding_box: BoundingBox;
}

export interface ChangedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
}

export interface SensorTelemetryMessage {
  site_id: string;
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
}

export interface RiskAssessmentResult {
  score: number;
  risk_level: RiskLevel;
  reasons: string[];
  visual_score: number;
  change_score: number;
  sensor_score: number;
  time_score: number;
  permit_score: number;
}
