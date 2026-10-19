# ConstructGuard Deployment & Infrastructure Guide

## 1. Quickstart: Multi-Container Docker Compose

The complete 7-service stack runs seamlessly using Docker and Docker Compose.

### Prerequisites
- Docker Engine &ge; 24.0.0
- Docker Compose &ge; 2.20.0

### One-Command Deployment
```bash
docker-compose up -d --build
```

### Inspecting Container Health
```bash
docker-compose ps
```

All 7 containers will be running:
1. `constructguard-postgres` (Port 5432)
2. `constructguard-redis` (Port 6379)
3. `constructguard-mqtt` (Port 1883)
4. `constructguard-cv` (Port 8000)
5. `constructguard-backend` (Port 5000)
6. `constructguard-iot` (Background telemetry publisher)
7. `constructguard-frontend` (Port 5173 / Port 80)

---

## 2. Environment Configuration Matrix (`.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment mode (`development` / `production`) | `production` |
| `PORT` | Node.js Backend HTTP port | `5000` |
| `DB_HOST` | PostgreSQL hostname | `localhost` / `postgres` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | Database name | `constructguard` |
| `REDIS_HOST` | Redis host | `localhost` / `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `MQTT_BROKER_URL`| Eclipse Mosquitto broker URI | `mqtt://localhost:1883` |
| `CV_SERVICE_URL` | Python FastAPI CV microservice URL | `http://localhost:8000` |
| `JWT_SECRET` | Secret key for signing access tokens | `constructguard_super_secret...` |

---

## 3. Database Migration & Seeding in Docker

To run database migrations and seed realistic Bangalore sites into the running PostgreSQL container:
```bash
docker-compose exec backend npm run seed
```

---

## 4. Bare-Metal Local Development Run Commands

### 1. Database & Brokers
```powershell
docker-compose up -d postgres redis mosquitto
```

### 2. Python Computer Vision Microservice
```powershell
cd cv-service
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Node.js Backend API & Workers
```powershell
cd backend
npm run dev
```

### 4. IoT Sensor Simulator
```powershell
cd iot-simulator
..\cv-service\.venv\Scripts\python.exe src/main.py
```

### 5. React Operator Dashboard
```powershell
cd frontend
npm run dev
```
