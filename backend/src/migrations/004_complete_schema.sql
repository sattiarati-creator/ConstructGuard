-- =========================================================================
-- ConstructGuard Database Migration 004: Complete Schema
-- Adding permit_number, changed_regions, resolved_at, audit_logs, refresh_tokens
-- =========================================================================

-- 1. Sites: add permit_number
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS permit_number VARCHAR(100);

-- Populate permit_number for seed sites
UPDATE sites SET permit_number = 'BLR-METRO-2026-091' WHERE code = 'site-101' OR name ILIKE '%Site 101%';
UPDATE sites SET permit_number = 'BBMP-RES-2026-4412' WHERE code = 'site-102' OR name ILIKE '%Site 102%';
UPDATE sites SET permit_number = 'BBMP-COM-2026-1189' WHERE code = 'site-103' OR name ILIKE '%Site 103%';
UPDATE sites SET permit_number = 'EXPIRED-2025-WTR-04' WHERE code = 'site-104' OR name ILIKE '%Site 104%';
UPDATE sites SET permit_number = 'KIADB-IND-2026-8801' WHERE code = 'site-105' OR name ILIKE '%Site 105%';

-- 2. Image Changes: add changed_regions JSONB
ALTER TABLE image_changes
ADD COLUMN IF NOT EXISTS changed_regions JSONB DEFAULT '[]'::jsonb;

-- 3. Alerts: add resolved_at TIMESTAMPTZ
ALTER TABLE alerts
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 4. Refresh Tokens Table (Secure Auth Sessions)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- 5. Audit Logs Table (Security & Compliance Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
