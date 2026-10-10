# ConstructGuard Security & Compliance Architecture

## 1. Role-Based Access Control (RBAC) Matrix

ConstructGuard enforces strict 3-tier Role-Based Access Control at the Express middleware layer:

| Resource / Action | ADMIN | INSPECTOR | VIEWER |
| :--- | :---: | :---: | :---: |
| View Dashboard & Telemetry | ✅ | ✅ | ✅ |
| View Risk Events & Alerts | ✅ | ✅ | ✅ |
| Acknowledge Alerts | ✅ | ✅ | ❌ |
| Resolve Alerts with Audit Notes | ✅ | ✅ | ❌ |
| Register / Edit Monitored Sites | ✅ | ✅ | ❌ |
| Register / Edit Cameras | ✅ | ✅ | ❌ |
| Delete Sites / Cameras | ✅ | ❌ | ❌ |
| Manage User Roles & Thresholds | ✅ | ❌ | ❌ |
| View System Audit Logs | ✅ | ✅ | ❌ |

---

## 2. Token Security & Lifecycle

- **Access Tokens**: Short-lived (15 minutes), signed with `HS256`, containing user ID and role claims.
- **Refresh Tokens**: Long-lived (7 days), stored securely in an HTTP-only, SameSite cookie.
- **Token Rotation & Revocation**: Refresh tokens are SHA-256 hashed and stored in the `refresh_tokens` PostgreSQL table. Upon each refresh cycle, the token is revoked and rotated. Logging out immediately marks the token hash as revoked.
- **Password Protection**: Passwords are encrypted using `bcrypt` with work factor 10. Development credentials are never hard-coded in production environments.

---

## 3. Defense-in-Depth Mechanisms

1. **Rate Limiting**:
   - `authLimiter`: 30 attempts per 15 minutes to thwart brute-force password guessing.
   - `apiLimiter`: 300 requests per 15 minutes per IP address for standard API paths.
2. **SQL Injection Defense**:
   - 100% of database interactions use parameterized SQL statements via PostgreSQL client pool. No raw string interpolation.
3. **HTTP Hardening**:
   - Helmet middleware applies strict HTTP response headers (Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options).
   - Strict CORS configuration restricts origins to authorized dashboard endpoints.
4. **Comprehensive Audit Trails**:
   - Every state change (site creation, permit modifications, alert resolutions) creates an immutable record in `audit_logs` capturing `user_id`, `action`, `entity_type`, `entity_id`, timestamp, and metadata.

---

## 4. Legal Compliance & Decision Support Notice

> **IMPORTANT NOTICE**:
> ConstructGuard detects indicators of potentially unauthorized construction and prioritizes sites for human inspection. The system provides decision support, not legal enforcement.
