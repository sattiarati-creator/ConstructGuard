# ConstructGuard API Specification (OpenAPI 3.0)

ConstructGuard exposes a RESTful API with JSON bodies, JWT Bearer authentication, and real-time Socket.IO events.

- **Interactive Swagger UI**: `http://localhost:5000/api-docs`
- **Base API URL**: `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new user profile (ADMIN, INSPECTOR, or VIEWER).
- **Request Body**:
  ```json
  {
    "name": "Jane Inspector",
    "email": "jane@constructguard.local",
    "password": "Password@123",
    "role": "INSPECTOR"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "success": true,
    "user": { "id": "uuid", "name": "Jane Inspector", "email": "jane@constructguard.local", "role": "INSPECTOR" },
    "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
  }
  ```

### `POST /api/auth/login`
Authenticates credentials with rate limiting (30 requests / 15m).
- **Request Body**:
  ```json
  {
    "email": "admin@constructguard.local",
    "password": "Admin@123"
  }
  ```
- **Response `200 OK`**:
  Returns user profile and tokens. Also sets HTTP-only refresh token cookie.

### `POST /api/auth/refresh`
Rotates the refresh token and returns a new 15-minute access token.

### `POST /api/auth/logout`
Revokes active refresh token hash in PostgreSQL.

---

## 2. Monitored Sites Endpoints

### `GET /api/sites`
Query parameters: `?search=Metro&authorized=true`
- **Response `200 OK`**: Array of registered sites with permit dates and operating windows.

### `GET /api/sites/:id`
Returns site details, cameras, latest risk evaluation event, and alert stats.

### `POST /api/sites` (Requires ADMIN or INSPECTOR)
Registers a new monitored site with geolocation, permit details, and work curfew windows.

### `PUT /api/sites/:id` (Requires ADMIN or INSPECTOR)
Updates site parameters.

### `DELETE /api/sites/:id` (Requires ADMIN)
Deletes a site and logs audit record.

### `GET /api/sites/:id/sensors`
Returns historical sensor readings for the specified site.
- Query params: `?sensor_type=vibration&limit=50`

### `GET /api/sites/:id/sensors/latest`
Returns latest reading for all 5 sensor types (`vibration`, `noise`, `dust`, `motion`, `temperature`).

---

## 3. Camera Nodes Endpoints

### `GET /api/cameras`
- Query params: `?site_id=uuid`

### `POST /api/cameras` (Requires ADMIN or INSPECTOR)
Registers a new RTSP camera feed node.

---

## 4. Operator Alerts Endpoints

### `GET /api/alerts`
- Query params: `?severity=CRITICAL&status=OPEN&site_id=uuid&limit=20`

### `POST /api/alerts/:id/acknowledge` (Requires ADMIN or INSPECTOR)
Transitions alert from `OPEN` to `ACKNOWLEDGED`. Sets `acknowledged_by` and emits WebSocket event.

### `POST /api/alerts/:id/resolve` (Requires ADMIN or INSPECTOR)
- **Request Body**:
  ```json
  {
    "notes": "Inspector verified permitted variance on site. False positive anomaly."
  }
  ```
Transitions alert to `RESOLVED`, logs audit event, and notifies operators via WebSocket.

---

## 5. Risk Intelligence Endpoints

### `GET /api/risk-events`
- Query params: `?siteId=uuid&riskLevel=HIGH&limit=20`

### `POST /api/risk/analyze`
Evaluates multi-factor telemetry deterministically and returns risk score (0-100), risk level, and indicators.

---

## 6. Dashboard Analytics Endpoints

### `GET /api/dashboard/summary`
Returns top KPIs: totalSites, activeCameras, openAlerts, criticalAlerts, todayEvents.

### `GET /api/dashboard/risk-trends`
Returns 7-day risk trend history (avgScore, maxScore, highOrCritical).

### `GET /api/dashboard/site-summary`
Returns all sites with their latest risk index and open alert count for priority map rendering.
