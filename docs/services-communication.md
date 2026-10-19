# Inter-Service Communication Protocols

ConstructGuard adopts a decoupled, event-driven microservices architecture. Communication between components is structured according to clear protocols and latency requirements:

---

## 1. Communication Matrix

| Producer / Source | Consumer / Target | Protocol / Transport | Purpose | Data Payload |
|---|---|---|---|---|
| **Site Cameras / Ingestion** | **Backend API** | HTTP POST (REST) | Upload frame snapshot | Multipart image file + metadata (site_id, camera_id) |
| **Backend API** | **Redis / BullMQ** | Redis TCP Protocol | Queue image job | `{ imageId, cameraId, storagePath, timestamp }` |
| **CV BullMQ Worker** | **CV Service** | HTTP POST (REST) | Inference & Change detection | Multipart image files or file paths |
| **IoT Simulator** | **Mosquitto Broker** | MQTT (TCP:1883) | Sensor telemetry stream | JSON telemetry reading |
| **Mosquitto Broker** | **Backend MQTT Consumer** | MQTT (TCP:1883) | Telemetry ingestion & anomaly check | JSON telemetry reading |
| **Risk Engine Worker** | **PostgreSQL** | SQL (pg driver) | Store risk score & alerts | Normalized relational entities |
| **Backend Server** | **React Frontend** | WebSockets (Socket.IO) | Real-time alert notifications | `{ type: 'NEW_ALERT', alert: {...} }` |
| **React Frontend** | **Backend API** | HTTP (REST / JSON) | CRUD & Query operations | JSON request / response |

---

## 2. Telemetry Flow (MQTT)

### Topic Hierarchy:
```
constructguard/sites/{site_id}/sensors/{sensor_type}
```

### Example Topics:
- `constructguard/sites/site-101/sensors/vibration`
- `constructguard/sites/site-101/sensors/noise`
- `constructguard/sites/site-101/sensors/motion`
- `constructguard/sites/site-101/sensors/dust`

### Payload Schema:
```json
{
  "site_id": "site-101",
  "sensor_type": "vibration",
  "value": 0.82,
  "unit": "g",
  "timestamp": "2026-10-07T18:00:00.000Z"
}
```

---

## 3. Asynchronous Task Pipeline (BullMQ)

Heavy computer vision inference is never executed synchronously in the HTTP request path. Instead, work flows through three queues:

1. **`image-processing` Queue**:
   - Ingests incoming site image metadata.
   - Invokes YOLO object detection and OpenCV change comparison.
   - Emits detection records.
2. **`risk-analysis` Queue**:
   - Takes detection findings + active sensor readings + site permit rules.
   - Computes multi-factor risk score.
3. **`alert-processing` Queue**:
   - Evaluates whether risk score exceeds critical thresholds.
   - Persists alert in PostgreSQL.
   - Emits WebSocket event to operators.

---

## 4. Real-Time Push Events (Socket.IO)

Connected dashboard clients join site-specific or global alert rooms:
- Room: `alerts:global` -> Broadcasts all high/critical alerts.
- Room: `site:{site_id}` -> Broadcasts site telemetry and frame updates.

### Events:
- `alert:created` — Triggered when a new alert is generated.
- `sensor:reading` — Triggered on high-frequency sensor updates.
- `camera:status` — Triggered when camera state changes (online/offline).
