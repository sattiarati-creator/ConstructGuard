# ConstructGuard Comprehensive Testing Architecture

ConstructGuard incorporates automated testing across all microservices, ensuring strict mathematical correctness of the deterministic risk engine, robust error handling, concurrency safety, and seamless UI presentation.

---

## 1. Test Suite Summary Matrix

| Service | Framework | Scope | Tests Run | Result |
| :--- | :--- | :--- | :---: | :---: |
| **Backend API & Risk Engine** | Jest + Supertest | Unit, Integration, BullMQ, DB, Auth, Risk Engine | 12 Suites / 100 Tests | **100% PASS** |
| **Computer Vision Service** | Pytest | YOLOv11 inference, OpenCV change detection, benchmarking | 21 Tests | **100% PASS** |
| **IoT Sensor Simulator** | Pytest | Sensor generation, normal/burst/noise telemetry, MQTT | 8 Tests | **100% PASS** |
| **Operator Frontend** | Vitest + RTL | UI Components, Badges, Charts, Auth Context, Disclaimer | 10 Suites / 20+ Tests | **PASS** |

---

## 2. Running All Tests

### Run Backend Tests (Node / Jest)
```powershell
cd backend
npm test
```
**Coverage includes:**
- `auth.unit.test.ts` & `auth.integration.test.ts` (Password hashing, JWT generation, token refresh rotation, role protection).
- `riskEngine.test.ts` (Strict mathematical scoring, 5 component weights, boundary validation).
- `temporalRisk.test.ts` (Working hours, weekends, curfew violations).
- `visualRisk.test.ts` (Machinery detection scoring, change detection thresholds).
- `sensorAnomalies.test.ts` (Vibration spikes, noise thresholds, dust levels).
- `bullmqReliability.test.ts` (Job retries, exponential backoff, dead letter queue handling).
- `mqttValidation.test.ts` (Payload validation, topic structure, error resilience).
- `db.test.ts` (Connection pool reliability, transaction integrity).

### Run Computer Vision Tests (Python / Pytest)
```powershell
cd cv-service
.\.venv\Scripts\python.exe -m pytest cv-service/tests -v
```
**Coverage includes:**
- Ultralytics YOLOv11 model loading and inference.
- Heavy machinery detection classes (`excavator`, `truck`, `crane`, `person`).
- OpenCV Structural Similarity Index (SSIM) and frame differencing.
- Edge cases: Identical frames (0% change), complete scene shift (100% change), corrupt images.

### Run IoT Simulator Tests (Python / Pytest)
```powershell
cd iot-simulator
..\cv-service\.venv\Scripts\python.exe -m pytest iot-simulator/tests -v
```
**Coverage includes:**
- Baseline Gaussian sensor reading distributions.
- Anomalous burst injection (structural vibration &gt; 4.5 mm/s, night noise &gt; 75 dBA).
- MQTT serialization and topic schema conformity.

### Run Frontend Tests (React / Vitest)
```powershell
cd frontend
npm test
```
**Coverage includes:**
- `formatters.test.ts`: Date and risk severity string utilities.
- `RiskBadge.test.tsx`: Color coding, badges, and score displays.
- `AlertBadge.test.tsx`: Severity and status badges.
- `StatCard.test.tsx`: Metric presentation and critical status indicators.
- `DisclaimerBanner.test.tsx`: Verifies regulatory decision support disclaimer.
- `Modal.test.tsx`: Keyboard accessibility and modal lifecycle.
- `ProtectedRoute.test.tsx`: RBAC client-side route guarding.
- `AuthContext.test.tsx`: State changes and authentication tokens.
- `ComponentScoresChart.test.tsx`: 5-factor breakdown rendering.
- `Navbar.test.tsx`: Telemetry connection indicator and user pill.
