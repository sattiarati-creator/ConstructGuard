# ConstructGuard Architecture Documentation

ConstructGuard is an enterprise-grade distributed system designed to detect and assess unauthorized construction activities in real-time by fusing computer vision evidence, IoT sensor telemetry, and regulatory permit compliance rules.

---

## 1. High-Level System Architecture

```
                 ┌─────────────────────────────────┐
                 │       Site IP Cameras           │
                 │   (Periodic Snapshot Frames)    │
                 └────────────────┬────────────────┘
                                  │ POST /api/images/ingest
                                  ▼
                ┌───────────────────────────────────┐
                │        Node.js Backend API        │
                │        (Express + TS)             │
                └─────────────────┬─────────────────┘
                                  │ Dispatches Job
                                  ▼
                        ┌───────────────────┐
                        │   BullMQ + Redis  │
                        │  (Durable Queues) │
                        └─────────┬─────────┘
                                  │
                                  ├───────────────────────────────┐
                                  ▼                               ▼
                 ┌─────────────────────────────────┐    ┌──────────────────┐
                 │        CV Worker Service        │    │ Risk Assessment  │
                 │   Python / FastAPI / OpenCV     │    │ Worker (Fusion)  │
                 │   - YOLOv8 Object Detection     │    └────────┬─────────┘
                 │   - Pixel Difference Analysis   │             │
                 └────────────────┬────────────────┘             │
                                  │ Detections & Change %        │
                                  └──────────────────────────────┘
                                                  │
                                                  ▼
                                       ┌───────────────────────┐
                                       │ PostgreSQL Database   │
                                       │ (ACID Event Storage)  │
                                       └──────────┬────────────┘
                                                  │
                                                  ▼
                                       ┌───────────────────────┐
                                       │ Socket.IO Server      │
                                       └──────────┬────────────┘
                                                  │ Push Event
                                                  ▼
                                       ┌───────────────────────┐
                                       │ React Operator Web UI │
                                       │ (Leaflet Map + Feeds) │
                                       └───────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend (`frontend/`)
- **Technology**: React 18, TypeScript, Vite, Tailwind CSS, Leaflet / OpenStreetMap.
- **Role**: Operator command center for visual surveillance, real-time alert triage, interactive geospatial site inspection, and risk analytics.
- **Communication**: REST API for querying historical data + WebSockets (`socket.io-client`) for push-based alert dispatching.

### 2.2 Backend API & Orchestrator (`backend/`)
- **Technology**: Node.js, Express, TypeScript, BullMQ, Redis, PostgreSQL.
- **Role**:
  - Serves REST endpoints for site management, camera registry, alert escalation, and historical analytics.
  - Hosts the MQTT client consuming IoT sensor streams.
  - Enqueues heavy asynchronous tasks to Redis-backed BullMQ queues (`image-processing`, `risk-analysis`, `alert-processing`).
  - Emits real-time WebSocket events to connected frontend clients.

### 2.3 Computer Vision Service (`cv-service/`)
- **Technology**: Python 3.11, FastAPI, OpenCV, YOLO (Ultralytics), NumPy.
- **Role**:
  - High-performance, isolated microservice dedicated to visual computing.
  - Runs YOLOv8 inference to detect construction equipment (excavators, dump trucks, cranes, workers).
  - Performs structural change detection comparing prior vs. current site frames using grayscale thresholding, Gaussian blur, and morphological contour analysis.
  - Returns normalized detection counts and change percentages to workers.

### 2.4 IoT Telemetry Simulator (`iot-simulator/`)
- **Technology**: Python 3.11, Paho-MQTT.
- **Role**:
  - Simulates environmental sensors installed on physical construction perimeters (vibration, acoustic noise, PIR motion, ambient dust PM10, temperature).
  - Publishes telemetry to Mosquitto MQTT broker on hierarchical topics (`constructguard/sites/{site_id}/sensors/{sensor_type}`).
  - Emits background baseline readings with injected anomalous spikes (e.g. night-time vibration + high decibels).

### 2.5 Storage & Messaging Layer
- **PostgreSQL 16**: Relational source-of-truth ensuring relational integrity across sites, cameras, images, detections, sensor telemetry, and alerts.
- **Redis 7**: High-throughput in-memory data store for BullMQ job queue management, rate limiting, and ephemeral cache.
- **Mosquitto 2.0**: Lightweight MQTT message broker handling high-frequency sensor streams with QoS guarantees.
