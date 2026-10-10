-- =========================================================================
-- ConstructGuard Database Migration 002: Add sensor_id & Composite Indexes
-- =========================================================================

-- 1. Add sensor_id to sensor_readings
ALTER TABLE sensor_readings 
ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(100);

-- 2. Add human-readable site code to sites table for seamless MQTT mapping (e.g., 'site-101')
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Populate code for existing known seed sites if null
UPDATE sites SET code = 'site-101' WHERE (name ILIKE '%Site 101%' OR id = 'b2c3d4e5-0002-4000-8000-000000000101') AND code IS NULL;
UPDATE sites SET code = 'site-102' WHERE (name ILIKE '%Site 102%' OR id = 'b2c3d4e5-0002-4000-8000-000000000102') AND code IS NULL;
UPDATE sites SET code = 'site-103' WHERE (name ILIKE '%Site 103%' OR id = 'b2c3d4e5-0002-4000-8000-000000000103') AND code IS NULL;
UPDATE sites SET code = 'site-104' WHERE (name ILIKE '%Site 104%' OR id = 'b2c3d4e5-0002-4000-8000-000000000104') AND code IS NULL;
UPDATE sites SET code = 'site-105' WHERE (name ILIKE '%Site 105%' OR id = 'b2c3d4e5-0002-4000-8000-000000000105') AND code IS NULL;

-- 3. High-Performance Composite Index for Sensor Time-Series Querying
-- Essential for queries filtering by site and sensor type ordered by timestamp DESC
-- e.g., SELECT * FROM sensor_readings WHERE site_id = $1 AND sensor_type = $2 ORDER BY timestamp DESC LIMIT 50;
CREATE INDEX IF NOT EXISTS idx_sensor_readings_site_type_time 
ON sensor_readings(site_id, sensor_type, timestamp DESC);

-- 4. Additional Filter Indexes
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_type 
ON sensor_readings(sensor_type);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id 
ON sensor_readings(sensor_id);

CREATE INDEX IF NOT EXISTS idx_sites_code 
ON sites(code);
