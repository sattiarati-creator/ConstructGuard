-- =========================================================================
-- ConstructGuard Database Migration 001: Initial Schema
-- =========================================================================

-- Enable pgcrypto extension for gen_random_uuid() if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table (RBAC Authentication)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'INSPECTOR', 'VIEWER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Construction Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL CHECK (latitude >= -90.0 AND latitude <= 90.0),
    longitude NUMERIC(10, 7) NOT NULL CHECK (longitude >= -180.0 AND longitude <= 180.0),
    address TEXT NOT NULL,
    authorized BOOLEAN NOT NULL DEFAULT true,
    permit_start_date DATE,
    permit_end_date DATE,
    permitted_start_time TIME,
    permitted_end_time TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    stream_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('ONLINE', 'OFFLINE')),
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. IoT Sensor Telemetry Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    sensor_type VARCHAR(50) NOT NULL CHECK (sensor_type IN ('vibration', 'noise', 'motion', 'temperature', 'dust')),
    value NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Captured Camera Images Table
CREATE TABLE IF NOT EXISTS images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    image_hash VARCHAR(64) UNIQUE NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (processing_status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Computer Vision Detections Table
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    object_class VARCHAR(100) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    bounding_box JSONB NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. OpenCV Image Change Comparisons Table
CREATE TABLE IF NOT EXISTS image_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    previous_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    change_percentage NUMERIC(5, 2) NOT NULL CHECK (change_percentage >= 0.0 AND change_percentage <= 100.0),
    change_type VARCHAR(50) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Risk Events Table (Aggregated Fusion Output)
CREATE TABLE IF NOT EXISTS risk_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    visual_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (visual_score >= 0.0 AND visual_score <= 100.0),
    change_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (change_score >= 0.0 AND change_score <= 100.0),
    sensor_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (sensor_score >= 0.0 AND sensor_score <= 100.0),
    time_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (time_score >= 0.0 AND time_score <= 100.0),
    permit_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (permit_score >= 0.0 AND permit_score <= 100.0),
    overall_score NUMERIC(5, 2) NOT NULL CHECK (overall_score >= 0.0 AND overall_score <= 100.0),
    risk_level VARCHAR(50) NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Operator Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_event_id UUID NOT NULL REFERENCES risk_events(id) ON DELETE CASCADE,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED')),
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Asynchronous Queue Processing Jobs Table
CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    attempts INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- =========================================================================
-- Performance & Lookup Indexes
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_sites_authorized ON sites(authorized);
CREATE INDEX IF NOT EXISTS idx_cameras_site_id ON cameras(site_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_site_id ON sensor_readings(site_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_site_timestamp ON sensor_readings(site_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_images_camera_id ON images(camera_id);
CREATE INDEX IF NOT EXISTS idx_images_image_hash ON images(image_hash);
CREATE INDEX IF NOT EXISTS idx_detections_image_id ON detections(image_id);
CREATE INDEX IF NOT EXISTS idx_image_changes_image_id ON image_changes(image_id);
CREATE INDEX IF NOT EXISTS idx_risk_events_site_id ON risk_events(site_id);
CREATE INDEX IF NOT EXISTS idx_risk_events_created_at ON risk_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_risk_level ON risk_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_event_id ON alerts(risk_event_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_image_id ON processing_jobs(image_id);
