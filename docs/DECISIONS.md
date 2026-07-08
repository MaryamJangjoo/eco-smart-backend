# ECO-SMART Architectural Decisions Log (ADR)

## Status

* **Version:** 2.0.0
* **Date:** July 08, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Lead Software Architect
* **Target Audience:** Engineering Teams, AI Coding Assistants, System Integrators
* **Document Type:** CURRENT STATE. Each ADR below is marked with an explicit **Implementation Status** showing whether the decision, as written, matches what the code actually does today. Two ADRs (004, 006) are formally amended in this revision because the original decision does not match implementation, and the gap has been open long enough that it needs to be resolved as policy, not quietly patched in a doc.

---

## ADR-001: Selection of Primary Persistent Database Engine

* **Date:** October 12, 2025
* **Status:** APPROVED / IMMUTABLE
* **Implementation Status:** ✅ MATCHES CODE — `docker-compose.yml` runs `postgres:15-alpine`; `TypeOrmModule.forRootAsync` in `app.module.ts` configures `type: 'postgres'` exclusively.

### Decision
PostgreSQL MUST be used as the exclusive primary relational database engine for all persistence requirements across the ECO-SMART system.

### Reason
Strict ACID compliance, relational constraint handling, native transactional support, strong indexing under concurrent foreign-key joins.

### Alternatives
* MongoDB — rejected: no rigid transactional/relational guarantees.
* MySQL — rejected: weaker isolation under heavy concurrent read-write patterns.

### Trade-offs
* **Pros:** relational integrity, JSONB support (used today — see `Site.settings`, `Site.contact`, `Device.metadata`), strong indexing.
* **Cons:** requires active connection-pool/memory tuning under load; manual partitioning if scaled.

### Impact
All schemas target PostgreSQL exclusively. No NoSQL abstraction layer exists or is planned.

### Implementation Note
`TypeOrmModule.forRootAsync` currently sets `synchronize: true`. This is acceptable for local development only. Before any staging/production environment is stood up, this MUST be switched to explicit TypeORM migrations (`src/database/migrations/`, per AI_RULES.md §2) — `synchronize: true` can silently drop or alter columns against a live database.

---

## ADR-002: Framework Selection for Core Backend Application

* **Date:** October 14, 2025
* **Status:** APPROVED
* **Implementation Status:** ✅ MATCHES CODE — single NestJS application, DI-based modules throughout (`AuthModule`, `UsersModule`, `SitesModule`, `DevicesModule`, `MyBusModule`, `HealthModule`).

### Decision
NestJS (Node.js framework) MUST be utilized to implement the main application logic, core business services, and public API routers.

### Reason
Enforces structured, DI-based architecture; standardizes patterns across a scaling team.

### Alternatives
* Express.js — rejected: no architectural guardrails at scale.
* Fastify standalone — rejected: no built-in DI/module system.

### Trade-offs
* **Pros:** predictable modular design, native DI container, TypeScript-first.
* **Cons:** steeper initial learning curve, marginally higher runtime overhead than minimal frameworks.

### Impact
All backend logic MUST be written as NestJS modules using providers, guards, interceptors, and pipes — confirmed current practice (`JwtAuthGuard`, `RolesGuard`, `DeviceAccessGuard`, `AccountingInterceptor`).

### Correction to Impact Statement
There is **no separate FastAPI gateway** in this system. Earlier drafts of this ADR and of `ARCHITECTURE.md` implied a two-tier NestJS-behind-FastAPI topology. That topology does not exist. NestJS is the entire backend, full stop, until a future ADR explicitly introduces a gateway tier.

---

## ADR-003: Architectural Primary Key Structure Identification

* **Date:** November 03, 2025
* **Status:** APPROVED / IMMUTABLE
* **Implementation Status:** ✅ MATCHES CODE — every entity (`User`, `Site`, `Device`, `DeviceRegistry`, `PasswordReset`) uses `@PrimaryGeneratedColumn('uuid')`.

### Decision
Every database entity table mapped by TypeORM MUST employ UUIDv4 as its primary key cluster identification column.

### Reason
Decouples ID generation from the DB engine; prevents collision risk during migrations/sharding; avoids exposing resource-volume counts via sequential IDs.

### Alternatives
* Auto-incrementing integers/BigInt — rejected: exposes business volume via URLs, sequencing bottlenecks under distributed merges.

### Trade-offs
* **Pros:** decentralized key generation, no volume leakage, trivial merging.
* **Cons:** larger index size (128-bit vs 64-bit) — accepted cost, not yet a measured bottleneck at current scale.

### Impact
Confirmed: no entity in the codebase uses an integer/serial primary key.

---

## ADR-004: Token Transmission Security Protocol — **AMENDED**

* **Original Date:** December 05, 2025
* **Original Status:** APPROVED / IMMUTABLE
* **Amendment Date:** July 08, 2026
* **Amendment Status:** AMENDED — original decision superseded below
* **Implementation Status:** ⚠️ Original decision did NOT match code. This ADR is amended to describe and approve the pattern actually implemented, rather than leaving a standing rule the codebase has never followed.

### Original Decision (superseded)
"Outbound JWTs MUST be delivered exclusively via server-set `HttpOnly`, `Secure`, `SameSite=Strict` browser cookies."

### Why This Is Being Amended, Not Silently Enforced
`AuthService.login()` and `AuthService.refreshTokens()` have, since their initial implementation, returned tokens directly in the JSON response body. `JwtAccessStrategy` and `JwtRefreshStrategy` both extract from `Authorization: Bearer <token>` via `ExtractJwt.fromAuthHeaderAsBearerToken()`. No cookie-setting code exists anywhere in `AuthController` or `AuthService`. This is not a regression — it is how the auth flow has always worked in this repository. Continuing to assert the cookie-based rule in documentation while the actual system does the opposite created exactly the contradiction this rewrite exists to fix.

### Amended Decision
Access and refresh tokens are delivered via the **`Authorization: Bearer <token>` header**, issued in the JSON response body of `POST /auth/login` and `POST /auth/refresh`. Clients are responsible for storing and attaching the token themselves.

### Reason for Amended Approach
Bearer-header delivery is simpler for the current consumer set (no browser-cookie/CSRF machinery needed), and matches how the mobile/API-first clients this system currently serves are expected to integrate.

### Trade-offs of Amended Approach
* **Pros:** simpler client integration, no CORS/cookie/SameSite complexity, works uniformly across browser and non-browser clients.
* **Cons:** tokens are vulnerable to theft via XSS if a browser client ever stores them in `localStorage`/JS-accessible state; this system provides no protection against that at the transport layer — any browser-based client consuming this API is responsible for its own token storage hygiene.

### Impact
* Controllers and services MAY continue returning `access_token`/`refresh_token` in JSON bodies — this is the approved current pattern, not a violation.
* If a browser-hosted first-party client is introduced in the future, a new ADR must evaluate whether `HttpOnly` cookies are needed for *that* client specifically, rather than retrofitting the entire API.
* Refresh tokens continue to be bcrypt-hashed at rest (`user.currentHashedRefreshToken`) — this part of the original security intent is preserved and should not be weakened.

---

## ADR-005: mYBUS Protocol Evolution and Synchronization Format

* **Date:** June 15, 2026
* **Status:** APPROVED / IMMUTABLE
* **Implementation Status:** ⚠️ PARTIALLY MATCHES CODE — see note below.

### Decision
The hardware messaging engine MUST use the `mYBUS-v2` protocol, enforcing a hard-coded 24-byte binary frame structure initialized by a static sync marker `0xAA`.

### Reason
Edge controllers have limited processing power/bandwidth; a static-length binary frame guarantees predictable memory footprint and fast deterministic parsing.

### Alternatives
* JSON over MQTT — rejected: parsing/allocation overhead too high for low-power microcontrollers.
* Protobuf over gRPC to the edge — rejected: transport complexity unsupported by target hardware.

### Trade-offs
* **Pros:** maximum processing efficiency, zero heap fragmentation, minimal network overhead.
* **Cons:** no human readability without tooling; structural changes require global coordination.

### Impact
Any binary frame parser MUST validate the `0xAA` marker at byte offset zero and reject frames outside the 24-byte bound.

### Implementation Note — Read Before Assuming This Is Wired End-to-End
The **application-layer** mYBUS handshake and secure-data exchange described in ADR-005 is implemented (`MyBusSecurityService`: ECDH key exchange, HKDF-SHA256 derivation, HMAC challenge, AES-256-GCM decrypt) and is reachable via `POST /devices/handshake` and `POST /devices/data`. However, this current implementation operates on **JSON payloads carrying hex-encoded fields** (`iv`, `authTag`, `encryptedData` as hex strings in `SecureDataRequestDto`), not on a raw 24-byte binary frame with a `0xAA` sync marker. No code in this repository currently parses or validates a fixed 24-byte binary frame. If a literal binary frame parser is required at the transport layer (e.g., for real edge hardware rather than this JSON-based reference implementation), it does not exist yet and must be built as new work, not assumed present.

### Additional Known Issue (Security-Relevant — Do Not Silently Fix)
`MyBusSecurityService.verifyDeviceChallenge()` currently treats the literal string `'test_hmac'` as a valid HMAC value unconditionally, and `decryptMyBusData()` returns the raw payload unmodified if it equals `'test_encrypted_payload'` or contains the substring `'action'`. These test bypasses currently ship in the same code path as production traffic. Given ADR-005's IMMUTABLE status on protocol integrity, and given SYSTEM_TRUTH_PRIORITY.md's rule that security concerns override all other layers, this is flagged as requiring remediation (removal of the bypass, or an explicit environment-gated flag) before this protocol can be considered production-ready.

---

## ADR-006: Cryptographic Password Storage Parameters — **AMENDED**

* **Original Date:** June 22, 2026
* **Original Status:** APPROVED
* **Amendment Date:** July 08, 2026
* **Amendment Status:** AMENDED — original decision superseded below
* **Implementation Status:** ⚠️ Original decision did NOT match code.

### Original Decision (superseded)
"User authentication password strings MUST be securely processed using the Argon2id cryptographic password hashing algorithm with static operational resource locks ($m=65536$ KiB, $t=3$, $p=4$)."

### Why This Is Being Amended
`AuthService` uses `bcryptjs` exclusively — `bcrypt.genSalt(10)` and `bcrypt.hash()` in `register()` and `resetPassword()`, `bcrypt.compare()` in `login()`. The `argon2` package is listed in `package.json` dependencies but is never imported anywhere in `src/`. No code path in this repository has ever used Argon2id.

### Amended Decision
Password hashing uses **`bcryptjs`** with a cost factor of **10** (`bcrypt.genSalt(10)`), applied uniformly at registration and password reset.

### Reason for Amended Approach
This reflects actual, tested, working production code. A documentation rule that has never once been true in the running system provides negative value — it teaches the wrong lesson to anyone (human or AI) reading it as ground truth.

### Trade-offs of Amended Approach
* **Pros:** bcrypt is a well-vetted, industry-standard algorithm; cost factor 10 is a reasonable default.
* **Cons:** bcrypt lacks Argon2id's configurable memory-hardness, making it comparatively more vulnerable to large-scale parallelized (GPU/ASIC) brute-force attacks than a well-tuned Argon2id configuration would be.

### Impact
* The unused `argon2` dependency should either be removed from `package.json`, or a follow-up ADR should schedule an actual migration of `AuthService` to Argon2id (with a defined rollout plan for re-hashing existing users on next login, since bcrypt hashes cannot be converted to Argon2id hashes directly).
* Until such a migration ADR exists and is executed in code, no document should assert that Argon2id is in use.

---

## Summary of Amendments in This Revision

| ADR | Original Claim | Actual Code Behavior | Resolution |
|---|---|---|---|
| ADR-004 | HttpOnly cookie tokens only | `Authorization: Bearer` header, tokens in JSON body | Amended to match code; cookie approach deferred to future ADR if a browser-hosted client is built |
| ADR-006 | Argon2id required | bcryptjs, cost factor 10 | Amended to match code; Argon2id migration deferred to future ADR if undertaken |
| ADR-005 | 24-byte binary frame, `0xAA` marker | JSON/hex-encoded application layer only; no raw frame parser exists | Implementation note added; binary parser remains a real future task, not yet done |
