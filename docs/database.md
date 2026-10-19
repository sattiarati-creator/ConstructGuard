# ConstructGuard Database Architecture Specification

## Overview
ConstructGuard leverages **PostgreSQL 16** with strict relational integrity, UUID primary keys, specialized JSONB payloads for computer-vision and IoT anomalies, and indexed query patterns.

---

## 1. Entity-Relationship Model (Mermaid)

```mermaid
erDiagram
    users ||--o{ alerts : "acknowledges"
    users ||--o{ audit_logs : "triggers"
    users ||--o{ refresh_tokens : "owns"
    sites ||--o{ cameras : "has"
    sites ||--o{ sensor_readings : "generates"
    sites ||--o{ risk_events : "evaluated_for"
    cameras ||--o{ images : "captures"
    images ||--o{ detections : "contains"
    images ||--o{ image_changes : "current_image"
    images ||--o{ image_changes : "previous_image"
    images ||--o{ processing_jobs : "queued_for"
    risk_events ||--o{ alerts : "triggers"

    users {
        UUID id PK
        VARCHAR name
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR role "CHECK(ADMIN, INSPECTOR, VIEWER)"
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    sites {
        UUID id PK
        VARCHAR name
        NUMERIC latitude
        NUMERIC longitude
        TEXT address
        BOOLEAN authorized
        VARCHAR permit_number
        DATE permit_start_date
        DATE permit_end_date
        TIME permitted_start_time
        TIME permitted_end_time
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    cameras {
        UUID id PK
        UUID site_id FK
        VARCHAR name
        VARCHAR stream_url
        VARCHAR status "CHECK(ONLINE, OFFLINE)"
        TIMESTAMPTZ last_seen_at
        TIMESTAMPTZ created_at
    }

    sensor_readings {
        UUID id PK
        UUID site_id FK
        VARCHAR sensor_id
        VARCHAR sensor_type "CHECK(vibration, noise, motion, temperature, dust)"
        NUMERIC value
        VARCHAR unit
        TIMESTAMPTZ timestamp
    }

    images {
        UUID id PK
        UUID camera_id FK
        VARCHAR image_hash
        VARCHAR storage_path
        TIMESTAMPTZ captured_at
        VARCHAR processing_status "CHECK(PENDING, PROCESSING, COMPLETED, FAILED)"
        TIMESTAMPTZ created_at
    }

    detections {
        UUID id PK
        UUID image_id FK
        VARCHAR object_class
        NUMERIC confidence
        JSONB bounding_box
        TIMESTAMPTZ detected_at
    }

    image_changes {
        UUID id PK
        UUID image_id FK
        UUID previous_image_id FK
        NUMERIC change_percentage
        VARCHAR change_type
        JSONB changed_regions
        TIMESTAMPTZ detected_at
    }

    risk_events {
        UUID id PK
        UUID site_id FK
        NUMERIC visual_score
        NUMERIC change_score
        NUMERIC sensor_score
        NUMERIC time_score
        NUMERIC permit_score
        NUMERIC overall_score
        VARCHAR risk_level "CHECK(LOW, MEDIUM, HIGH, CRITICAL)"
        TEXT explanation
        JSONB indicators
        TIMESTAMPTZ created_at
    }

    alerts {
        UUID id PK
        UUID risk_event_id FK
        VARCHAR severity "CHECK(LOW, MEDIUM, HIGH, CRITICAL)"
        VARCHAR status "CHECK(OPEN, ACKNOWLEDGED, RESOLVED)"
        UUID acknowledged_by FK
        TIMESTAMPTZ acknowledged_at
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
    }

    processing_jobs {
        UUID id PK
        UUID image_id FK
        VARCHAR job_type
        VARCHAR status "CHECK(QUEUED, RUNNING, COMPLETED, FAILED)"
        INTEGER attempts
        TEXT error_message
        TIMESTAMPTZ created_at
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
    }

    audit_logs {
        UUID id PK
        UUID user_id FK
        VARCHAR action
        VARCHAR entity_type
        VARCHAR entity_id
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    refresh_tokens {
        UUID id PK
        UUID user_id FK
        VARCHAR token_hash
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ revoked_at
        TIMESTAMPTZ created_at
    }
```

---

## 2. Key Database Indexes
- `idx_sites_auth_dates`: Optimizes temporal permit checks.
- `idx_sensor_readings_site_type_ts`: Fast time-window telemetry aggregations (`site_id`, `sensor_type`, `timestamp DESC`).
- `idx_risk_events_site_created`: Rapid risk trend calculations (`site_id`, `created_at DESC`).
- `idx_alerts_status_severity`: Live triage operator queries (`status`, `severity`, `created_at DESC`).
- `idx_detections_image`: Fast lookup of bounding box items per captured frame.
- `idx_processing_jobs_status`: BullMQ worker idempotency and retry queue lookups.
- `idx_refresh_tokens_hash`: Quick token revocation and rotation lookups.
