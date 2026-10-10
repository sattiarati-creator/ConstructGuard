# ConstructGuard 🛡️
### Smart Unauthorized Construction Monitoring & Risk Intelligence System

> **⚠️ DECISION SUPPORT NOTICE**:
> ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection. The system provides decision support, not legal enforcement.

ConstructGuard is an enterprise full-stack IoT and Computer Vision risk intelligence platform designed to identify indicators of potentially unauthorized construction activities, nighttime violations, and environmental anomalies. By combining computer vision object detection (Ultralytics YOLOv11), OpenCV structural image differential analysis, IoT sensor telemetry, and a deterministic 5-factor risk intelligence engine, the system prioritizes sites for human inspector review.

---

## 🏛️ System Architecture

```
                ┌──────────────────────┐
                │ Camera / Images      │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Python CV Service    │
                │ FastAPI + YOLOv11    │
                │ OpenCV Differencing  │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
      Object Detection          Image Change Detection
              │                         │
              └────────────┬────────────┘
                           │
                           ▼
                 ┌─────────────────┐
                 │ Risk Engine     │
                 └────────┬────────┘
                          ▲
                          │
                 ┌────────┴────────┐
                 │ MQTT IoT        │
                 │ Sensors         │
                 └─────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Redis       │
                   │ BullMQ      │
                   └──────┬──────┘
                          │
                          ▼
                   ┌──────────────┐
                   │ Node Backend │
                   │ Express + TS │
                   └──────┬───────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
          PostgreSQL 16        Socket.IO
                │                   │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ React Dashboard   │
                └───────────────────┘
```

---

## 📦 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Dashboard** | React 18, TypeScript, Vite, Tailwind CSS, Leaflet, Recharts, Socket.IO Client |
| **Backend API & Queues** | Node.js, Express, TypeScript, Zod, JWT, bcrypt, BullMQ, Redis 7, Socket.IO |
| **Computer Vision Microservice** | Python 3.11/3.13, FastAPI, Ultralytics YOLOv11, OpenCV, NumPy, Pillow |
| **IoT Telemetry Bus** | Python, Eclipse Mosquitto MQTT 2.0, Paho-MQTT |
| **Relational Database** | PostgreSQL 16 (Indexed spatial, time-window, and JSONB queries) |
| **Testing Suites** | Jest, Supertest (12 suites / 100 tests), Pytest (CV & IoT: 29 tests), Vitest |
| **Containerization** | Docker, Docker Compose |

---

## 🔑 Development Seed Credentials

All accounts come pre-configured in the database migrations and seed scripts:

| Role | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@constructguard.local` | `Admin@123` | Full administrative control, system config, audits |
| **INSPECTOR** | `inspector@constructguard.local` | `Inspector@123` | Site inspection, alert acknowledge & resolve with notes |
| **VIEWER** | `viewer@constructguard.local` | `Viewer@123` | Read-only analytics, telemetry, and map inspection |

---

## 🌐 Application Access Endpoints

- **Operator Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **Interactive Swagger OpenAPI**: `http://localhost:5000/api-docs`
- **Computer Vision Docs**: `http://localhost:8000/docs`
- **Eclipse Mosquitto MQTT**: `localhost:1883`

---

## 📂 Repository Structure

```
constructguard/
├── frontend/             # React 18 + Vite + Tailwind operator dashboard
├── backend/              # Node.js + Express + TypeScript API, BullMQ & workers
├── cv-service/           # Python + FastAPI YOLOv11 & OpenCV microservice
├── iot-simulator/        # Python MQTT telemetry sensor simulator
├── shared/               # Shared domain contracts, types, and schemas
├── scripts/              # Seed scripts, mosquitto config, test helpers
├── tests/                # System & end-to-end integration tests
├── docs/                 # Complete 10-document engineering specifications
├── docker-compose.yml    # Complete multi-container orchestration
├── .env.example          # Environment variable template
├── Makefile              # Unified build and test targets
├── LICENSE               # MIT License
└── README.md             # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. One-Command Docker Compose Deployment
```bash
docker compose up -d --build
```

### 2. Seed Database with Bangalore Sites & Test Users
```bash
docker compose exec backend npm run seed
```

### 3. Run Automated Tests
```bash
# Run all tests across the platform
make test

# Or run individual service suites
cd backend && npm test
cd cv-service && pytest
cd iot-simulator && pytest
```

---

## 🗺️ Project Implementation Status

- [x] **Phase 0**: Project Foundation, Multi-Service Architecture & Docker Compose Config.
- [x] **Phase 1**: PostgreSQL Relational Data Modeling & Seed Migrations (12 tables, UUIDs, JSONB).
- [x] **Phase 2**: Computer Vision Microservice (Ultralytics YOLOv11 & OpenCV Frame Differencing).
- [x] **Phase 3**: IoT Telemetry & Ingestion Layer (Eclipse Mosquitto MQTT & Node.js Consumer).
- [x] **Phase 4**: Deterministic Risk Intelligence Fusion Engine & BullMQ Priority Worker Pipeline.
- [x] **Phase 5**: Real-Time Alerts, WebSockets & Operator Dashboard (React + Leaflet + Recharts).
- [x] **Phase 6**: Security (JWT Authentication, Refresh Token Rotation, RBAC, Rate Limiting & Audit Trail).
- [x] **Phase 7**: End-to-End Field Validation, 100/100 Backend Jest Tests, 29/29 Pytest Tests.
