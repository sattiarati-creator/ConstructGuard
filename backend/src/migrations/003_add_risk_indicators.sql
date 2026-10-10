-- =========================================================================
-- Migration 003: Add Risk Event Indicators, Image Reference and Performance Indexes
-- =========================================================================

ALTER TABLE risk_events 
ADD COLUMN IF NOT EXISTS indicators JSONB DEFAULT '[]'::jsonb;

ALTER TABLE risk_events 
ADD COLUMN IF NOT EXISTS image_id UUID REFERENCES images(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_risk_events_risk_level ON risk_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_events_site_risk_time ON risk_events(site_id, risk_level, created_at DESC);
