# API_SPEC.md

## Status

* **Version:** 2.0.0
* **Date:** July 08, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Principal API Architect
* **Target Audience:** Backend Engineers, QA, API Consumers, AI Coding Assistants
* **Document Type:** CURRENT STATE. Every route, DTO, and status code below has been verified against the controller source in `backend-api/src`. There is no `/api/v1` prefix in the running application — `main.ts` never calls `app.setGlobalPrefix()`. Routes are exactly as listed.

---

## 1. Global Conventions (Current)

* **Protocol:** the application listens on plain HTTP on port `3000` inside its container (`app.listen(3000)`); TLS termination, if any, happens outside this application (e.g., at a reverse proxy) and is not configured in this codebase.
* **Payload Format:** `application/json` for all non-device-frame traffic.
* **CORS:** `main.ts` currently sets `origin: '*'` with `credentials: true` and `methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'`. There is no per-tenant/organization header check anywhere in the codebase — no `X-Organization-Id` header is read, validated, or required by any guard or controller.
* **Validation:** a global `ValidationPipe` is registered with `whitelist: true, transform: true` — unknown DTO fields are stripped, and payloads are transformed to their DTO class instances before reaching controllers.
* **Documentation:** Swagger UI is mounted at `/api` (not versioned), built via `DocumentBuilder().setTitle('ECO-SMART API')...addBearerAuth()`.
* **Authentication header:** `Authorization: Bearer <access_token>` — see `ARCHITECTURE.md` §6 for the full flow. There are no cookie-based auth mechanisms in this system.

---

## 2. Error Response Shape (Actual)

NestJS's default global exception filter is in use — there is no custom global exception filter or `AppException` base class wired into `main.ts` in this codebase. A typical validation or thrown-exception error looks like NestJS's standard shape:

```json
{
  "statusCode": 400,
  "message": "Username is required",
  "error": "Bad Request"
}
```

For `class-validator` failures, `message` may be an array of per-field violation strings rather than a single string. There is currently no `correlationId`, `errorCode`, `path`, or `timestamp` field in error responses — any document or client integration assuming that envelope shape is not describing this API as it exists today. If that structured envelope is desired, it requires implementing a custom exception filter, which does not currently exist.

---

## 3. Authentication Endpoints — `/auth/*`

All routes below live in `AuthController`, decorated `@Controller('auth')`, wrapped globally with `AccountingInterceptor` (writes a `[ECO-SMART ACCOUNTING]` audit log line per request — see `ARCHITECTURE.md` §6 for the known `role` field gap in that log).

### `POST /auth/register`
Public. Body: `RegisterDto`.
```json
{
  "username": "test_operator",
  "email": "test@ecosmart.com",
  "phoneNumber": "+989123456789",
  "firstName": "Test",
  "lastName": "User",
  "address": "Tehran, Iran",
  "postalCode": "1234567890",
  "publicKey": "-----BEGIN PUBLIC KEY-----...",
  "password": "SecurePassword@2026"
}
```
`address`, `postalCode`, `publicKey` are optional. Role is **not** an input field — every registered user is created with no `role` value (see `ARCHITECTURE.md` §6, the entity has no `role` column) and no `siteRole` until added to a site. On success (`201`), the endpoint returns:
```json
{ "status": "pending_verification", "message": "Registration successful. Verification codes have been sent to your email." }
```
Both an email code and a phone OTP are generated and emailed together via MailHog (the phone OTP is currently also sent by email in the same message, not by SMS — there is no SMS integration in this codebase; `forgotPasswordByPhone` similarly only `console.log`s the SMS text rather than sending it anywhere).

### `POST /auth/login`
Public. Body: `LoginDto` (`username`, `password`).
Preconditions enforced in `AuthService.login()`: user must exist, `isEmailVerified` and `isPhoneVerified` must both be `true`, password must match via `bcrypt.compare`. Any failure throws `401 Unauthorized`.
Success (`200`):
```json
{ "access_token": "eyJ...", "refresh_token": "eyJ..." }
```
Field names are exactly `access_token` / `refresh_token` (snake_case), not `accessToken`/`refreshToken` — do not assume camelCase here without checking `AuthService.generateTokens()`.

### `POST /auth/refresh`
Guarded by `JwtRefreshGuard` (`AuthGuard('jwt-refresh')`). Requires `Authorization: Bearer <refresh_token>`. No request body. Returns the same `{ access_token, refresh_token }` shape as login, with both tokens freshly signed.

### `POST /auth/forgot-password/email`
Public. Body: `ForgotPasswordDto` (`email`). Generates a 5-digit code, SHA-256 hashes it into `PasswordReset`, emails the plaintext code via MailHog, expires in 15 minutes. **Current response includes the plaintext code in the JSON body** (`{ status, message, method: 'email', code }`) — this is present in the running code today; treat it as a known information-disclosure issue to flag for cleanup, not as documented intended behavior to defend.

### `POST /auth/forgot-password/phone`
Public. Body: `ForgotPasswordPhoneDto` (`phoneNumber`, validated against an Iranian mobile pattern `^(\+98|0)?9\d{9}$`). Same code-generation logic, 5-minute expiry, message only `console.log`'d server-side (no real SMS dispatch exists). Response also includes the plaintext `code` field.

### `POST /auth/reset-password`
Public. Body: `ResetPasswordDto` (`identifier`, `token`, `newPassword`, min length 6). Looks up the stored hashed code by identifier, checks expiry, re-hashes the new password with bcrypt, deletes the used reset record.

### `POST /auth/verify-email`
Public. Body: `VerifyEmailDto` (`email`, `code` — exactly 5 digits). Matches SHA-256 hash of submitted code against `emailVerificationCode`, checks `verificationExpiresAt`.

### `POST /auth/verify-phone`
Public. Body: `VerifyPhoneDto` (`phoneNumber`, `otp`). Same pattern against `phoneVerificationOtp`.

---

## 4. User Endpoints — `/users/*`

`UsersController`, `@Controller('users')`, guarded by `JwtAuthGuard` + `RolesGuard`, wrapped in `AccountingInterceptor`.

### `GET /users/me`
Requires `@Roles(SiteRole.OWNER, SiteRole.ADMIN, SiteRole.EDITOR, SiteRole.VIEWER)` — in practice this allows any authenticated user who has a `siteRole` set at all, since every value of the enum is listed. A user with `siteRole: null` (i.e., not yet attached to any site) will fail `RolesGuard`'s check and receive a `403`.
Response:
```json
{
  "success": true,
  "message": "Security transaction successfully recorded and verified",
  "project": "ECO-SMART",
  "data": {
    "userId": "018f67c2-...",
    "username": "operator_shiraz",
    "role": "VIEWER",
    "scopeInfo": { "isActive": true, "permissionGranted": true }
  }
}
```
Note the response field is `data.role`, sourced from `req.user.siteRole`, defaulted to `'VIEWER'` string if falsy — this is a display label, not the actual enum column name.

---

## 5. Site Endpoints — `/sites/*`

`SitesController`, `@Controller('sites')`, guarded at the class level by `@UseGuards(AuthGuard('jwt'))` (same underlying strategy as `JwtAuthGuard`, invoked directly rather than through the shared guard class).

### `POST /sites`
Body: `CreateSiteDto` (`name` required; `description`, `type` optional). Creates the site with the caller as `owner`, and also sets the caller's `siteId`/`siteRole: OWNER` as a side effect (`SitesService.createSite`).

### `GET /sites/:id`
Returns the site with `owner` and `users` relations loaded, if the caller has access (`SitesService.hasAccess`: owner or current site member). Otherwise `403`; if the site doesn't exist, `404`.

### `PUT /sites/:id`
Body: `UpdateSiteDto` (all fields optional: `name`, `address`, `description`, `type`, `status`, `latitude`, `longitude`). Requires the caller to be a member of that site with `siteRole` of `OWNER` or `ADMIN` — enforced in `SitesService.updateSite`, not by a route-level guard.

### `DELETE /sites/:id`
Requires the caller to be the site's `OWNER` (checked directly, not via `RolesGuard`).

There is currently no `GET /sites` (list-all-for-user) route wired to the controller, even though `SitesService.findAllForUser()` exists as a method — it is unused/unreachable via HTTP today. There is also no route corresponding to `ShareSiteDto` (`share-site.dto.ts` exists in the `dto/` folder but no controller method consumes it) — treat both as either incomplete features or dead code, not as documented working endpoints.

---

## 6. Device Endpoints — `/devices/*`

`DevicesController`, `@Controller('devices')`. **No class-level guard** — guarding is applied per-route.

### `POST /devices/register`
**Not guarded.** Body: `RegisterDeviceDto` (`deviceId`, `serialNumber` required; `name`, `model`, `firmwareVersion` optional). Rejects with `400` if `deviceId` or `serialNumber` already exist.

### `GET /devices`
**Not guarded.** Returns all devices, ordered by `createdAt DESC`. No pagination, no `limit`/`page` parameters exist despite `SYSTEM_CONSTRAINTS.md`/prior `API_SPEC.md` drafts implying a 500-record default cap elsewhere — no such cap is implemented for this route in current code.

### `GET /devices/:deviceId`
Guarded by `DeviceAccessGuard` (requires a valid JWT and site access — see `ARCHITECTURE.md` §7). Returns 404 if the device doesn't exist.

### `POST /devices/handshake`
**Not guarded** — this is the mYBUS device-authentication entry point itself, so it cannot require a user JWT. Body: `HandshakeRequestDto`.
* **Phase 1** (`security: 1`, `data.publicKeyPem` present): server generates an EC keypair, derives a session key via ECDH + HKDF, returns `{ serverPublicKeyPem }`.
* **Phase 2** (`security: 1`, `data.nonce` + `data.hmac` present): verifies the device's HMAC challenge against the derived session key (or accepts the literal string `'test_hmac'` — see `ARCHITECTURE.md` §8 known issue). On success returns `{ status: 'authenticated', message: '...', isAuthenticated: true }`.
* Any other combination of fields throws `400`.

### `POST /devices/data`
Guarded by `DeviceAccessGuard`. Body: `SecureDataRequestDto`, requires `security: 2` (rejected otherwise). Decrypts `data.encryptedData`/`data.iv`/`data.authTag` (hex strings) via AES-256-GCM using the device's session key, parses the resulting JSON as `{ action: 'READ' | 'WRITE', registryAddress, ... }`, and returns a structured `payloadResponse`. Any other `action` value throws `400`. Decryption/parse failures are caught and rethrown as `400 Application Layer Error: <raw error message>` — see `AI_RULES.md` §7 regarding this raw-error-leakage pattern.

---

## 7. Health Endpoint

### `GET /health`
Public, unguarded, in `HealthController` (`@Controller('health')`, no interceptor).
```json
{ "status": "OK", "timestamp": "2026-07-08T12:00:00.000Z" }
```
No downstream dependency checks (DB connectivity, mail connectivity) are performed — this is a liveness check only, not a readiness check.

---

## 8. Rate Limiting

**None is currently implemented anywhere in this codebase.** There is no rate-limiting package installed (no `@nestjs/throttler` or equivalent in `package.json`), no middleware, and no guard performing request-count tracking. Any prior document asserting a 5-requests-per-minute limit on `/auth/login` or `/auth/refresh` was describing intended future behavior, not the current system. If rate limiting is required, it must be implemented before this section can be updated to describe it as active.
