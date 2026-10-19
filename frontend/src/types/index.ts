export type UserRole = 'ADMIN' | 'INSPECTOR' | 'VIEWER';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type CameraStatus = 'ONLINE' | 'OFFLINE';
export type SensorType = 'vibration' | 'noise' | 'motion' | 'temperature' | 'dust';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
}

export interface Site {
  id: string;
  code?: string | null;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  authorized: boolean;
  permit_number?: string | null;
  permit_start_date: string | null;
  permit_end_date: string | null;
  permitted_start_time: string | null;
  permitted_end_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface Camera {
  id: string;
  site_id: string;
  name: string;
  stream_url: string;
  status: CameraStatus;
  last_seen_at: string | null;
  created_at: string;
}

export interface SensorReading {
  id: string;
  site_id: string;
  sensor_id?: string | null;
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: string;
}

export interface RiskEvent {
  id: string;
  site_id: string;
  image_id?: string | null;
  visual_score: number;
  change_score: number;
  sensor_score: number;
  time_score: number;
  permit_score: number;
  overall_score: number;
  risk_level: RiskLevel;
  explanation: string;
  indicators?: string[];
  site_name?: string;
  created_at: string;
}

export interface Alert {
  id: string;
  risk_event_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  site_name?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  explanation?: string;
}

export interface DashboardSummary {
  totalSites: number;
  activeCameras: number;
  openAlerts: number;
  criticalAlerts: number;
  todayEvents: number;
  lowRiskSites?: number;
  mediumRiskSites?: number;
  highRiskSites?: number;
  criticalSites?: number;
}

export interface RiskTrendItem {
  date: string;
  avgScore: number;
  maxScore: number;
  count: number;
  highOrCritical: number;
}

export interface SiteSummaryItem extends Site {
  latestRiskLevel: RiskLevel;
  latestRiskScore: number;
  latestRiskExplanation: string;
  openAlertCount: number;
}

export interface Detection {
  id: string;
  image_id: string;
  object_class: string;
  confidence: number;
  bounding_box: {
    x_min: number;
    y_min: number;
    x_max: number;
    y_max: number;
  };
  detected_at: string;
}

export interface ImageChange {
  id: string;
  image_id: string;
  previous_image_id: string;
  change_percentage: number;
  change_type: string;
  changed_regions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  detected_at: string;
}

export interface SiteImage {
  id: string;
  camera_id: string;
  image_hash: string;
  storage_path: string;
  captured_at: string;
  processing_status: string;
  created_at: string;
}

