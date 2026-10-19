export type UserRole = 'ADMIN' | 'INSPECTOR' | 'VIEWER';
export type CameraStatus = 'ONLINE' | 'OFFLINE';
export type SensorType = 'vibration' | 'noise' | 'motion' | 'temperature' | 'dust';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type JobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Camera {
  id: string;
  site_id: string;
  name: string;
  stream_url: string;
  status: CameraStatus;
  last_seen_at: Date | null;
  created_at: Date;
}

export interface SensorReading {
  id: string;
  site_id: string;
  sensor_id?: string | null;
  sensor_type: SensorType;
  value: number;
  unit: string;
  timestamp: Date;
}

export interface SiteImage {
  id: string;
  camera_id: string;
  image_hash: string;
  storage_path: string;
  captured_at: Date;
  processing_status: ProcessingStatus;
  created_at: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: string;
  image_id: string;
  object_class: string;
  confidence: number;
  bounding_box: BoundingBox;
  detected_at: Date;
}

export interface ChangedRegion {
  box: [number, number, number, number];
  area: number;
}

export interface ImageChange {
  id: string;
  image_id: string;
  previous_image_id: string | null;
  change_percentage: number;
  change_type: string;
  changed_regions?: ChangedRegion[];
  detected_at: Date;
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
  created_at: Date;
  site_name?: string;
}

export interface Alert {
  id: string;
  risk_event_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  acknowledged_by: string | null;
  acknowledged_at: Date | null;
  resolved_at?: Date | null;
  created_at: Date;
  // Joined fields
  site_name?: string;
  risk_score?: number;
  risk_level?: RiskLevel;
  explanation?: string;
}

export interface ProcessingJob {
  id: string;
  image_id: string | null;
  job_type: string;
  status: JobStatus;
  attempts: number;
  error_message: string | null;
  created_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface JwtUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
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
