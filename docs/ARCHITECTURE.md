# ECO-SMART System Architecture Document

## Status

* **Version:** 2.0.0
* **Date:** June 29, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Lead Software Architect
* **Target Audience:** Engineering Teams, AI Coding Assistants, System Integrators

---

## 1. Project Vision

The ECO-SMART platform is a highly resilient, low-latency, enterprise-grade distributed system engineered for automated energy optimization and hardware lifecycle orchestration in modern commercial and residential infrastructure. The system bridges cloud-based microservices with real-time edge building-automation networks to execute deterministic data processing, analytical insights, and low-latency closed-loop hardware control.

---

## 2. System Goals

* **Deterministic Latency:** Maximum end-to-end telemetry-to-command loop latency MUST NOT exceed 200 milliseconds.
* **High Availability:** Core orchestration layers MUST maintain a 99.95% uptime SLA, operating gracefully under hardware disconnects.
* **Strict Auditability:** Every transaction, user state change, and physical device state mutation MUST be cryptographically immutable and permanently audited.
* **Hardware Agnosticism:** The software core MUST remain completely separated from underlying hardware topologies via an abstract physical-device payload-mapping architecture.

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Client Dashboard                     │
│               (Blazor WebAssembly App)                 │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / Secure WebSockets
                            ▼
┌────────────────────────────────────────────────────────┐
│                  FastAPI Gateway                       │
│            (Reverse Proxy & Rate Limiter)              │
└───────────────────────────┬────────────────────────────┘
                            │ Internal gRPC / IPC
                            ▼
┌────────────────────────────────────────────────────────┐
│                 NestJS Backend Core                    │
│          (Auth, Core Logic, Audit Logging)             │
└──────┬────────────────────┬────────────────────┬───────┘
       │ TypeORM            │ Redis              │ Internal Event Bus
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  PostgreSQL  │     │ Cache & Lock │     │ mYBUS-v2 Mgmt│
│  (Database)  │     │   (Redis)    │     │ Microservice │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                 │ Proprietary TCP/IP
                                                 ▼
                                          ┌──────────────┐
                                          │ Smart Edge   │
                                          │ Controllers  │
                                          └──────────────┘

```

---

## 4. Backend Architecture

The backend application core utilizes a highly modular NestJS runtime framework layered over Node.js. It interfaces directly with PostgreSQL using TypeORM for permanent entity storage and features an independent microservice subsystem dedicated exclusively to the translation and handling of the low-level, proprietary `mYBUS-v2` building automation protocol.

---

## 5. Folder Structure

The monolithic and microservice backend codebases MUST strictly comply with the following directory tree layout. Deviation from this architecture is prohibited.

```
src/
├── config/                  # Global environmental and application configuration
├── common/                  # Shared decorators, guards, interceptors, and filters
│   ├── constants/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interceptors/
├── database/                # Migrations, seeds, and database configuration factories
│   ├── migrations/
│   └── seeds/
└── modules/                 # Encapsulated vertical feature modules
    ├── auth/                # Identity management, authentication, and tokens
    │   ├── controllers/
    │   ├── dto/
    │   ├── entities/
    │   ├── services/
    │   └── strategies/
    ├── users/               # Account definitions and user domain profiles
    ├── devices/             # Device definitions and status fields
    └── telemetry/           # Time-series message intake and analytical endpoints

```

---

## 6. Module Responsibilities

### 6.1. AuthModule

MUST isolate all procedures related to credential management, JWT issuance, session revocations, password hashing, and multi-tenant access control lists.

### 6.2. UsersModule

MUST manage user entity persistency, access profiles, and multi-factor validation states. It MUST NOT perform direct authentication challenges.

### 6.3. DevicesModule

MUST hold structural state, configurations, virtual mappings, firmware versions, and operational boundaries of all edge hardware targets.

### 6.4. TelemetryModule

MUST act as an optimized high-throughput buffer for sensor metrics, performance values, and error reports coming from downstream networks.

---

## 7. Coding Standards

* **Strict Typing:** The `any` implicit or explicit data type MUST NOT be committed to the codebase under any condition. If a type cannot be explicitly deduced, developer MUST use structural generics or strict `unknown` validation checks.
* **Immutability:** Variables SHOULD default to `const`. Mutable `let` references MUST only be scoped within mathematical loops or variable re-assignments.
* **Strict Null Verification:** All runtime references interacting with properties that can return null or undefined MUST use explicit optional chaining (`?.`) or deterministic nullish coalescing operators (`??`).

---

## 8. Naming Conventions

* **Files:** All system files MUST use kebab-case identifiers specifying the exact role type (e.g., `device-registration.controller.ts`, `user-session.entity.ts`).
* **Classes and Types:** Classes, Interfaces, and Type definitions MUST use PascalCase formatting (e.g., `AuthService`, `JwtAccessStrategy`).
* **Variables, Methods, and Functions:** All local variables, properties, functions, and class methods MUST use camelCase naming (e.g., `generateAccessToken`, `userId`).
* **Database Objects:** Tables, column descriptions, and primary keys stored in PostgreSQL MUST use strictly lowercase snake_case (e.g., `user_accounts`, `refresh_token_hash`).

---

## 9. DTO Guidelines

* **Validation Immutability:** DTO classes MUST utilize the `class-validator` package with properties marked with the `readonly` TS keyword.
* **Completeness:** DTOs MUST contain comprehensive decorator sets representing formatting and baseline limits (e.g., `@IsUUID()`, `@IsString()`, `@MinLength(8)`).
* **Context Safety:** Entities MUST NEVER be exposed directly on HTTP endpoints. Incoming network requests and outbound payload objects MUST have dedicated DTO definitions.

---

## 10. Entity Guidelines

* **Primary Keys:** Every database table entity mapped by TypeORM MUST employ a cryptographically strong Universally Unique Identifier (`UUIDv4`) as its primary cluster identifier column.
* **Implicit Tracking:** All standard data tables MUST inherit a baseline class structure containing `created_at`, `updated_at`, and a hidden `version` concurrency verification count field.
* **Relationship Strictness:** Cascading deletion flags on table schemas MUST NOT be implemented without explicit written review from the lead DB architect.

---

## 11. Repository Rules

* **Isolation of Storage:** Business operational flow structures MUST remain unaware of low-level SQL mechanics. All raw data lookup mechanics MUST be bound cleanly within repository definitions.
* **No Active Record Pattern:** The Active Record design model is strictly prohibited. All persistence actions MUST use the TypeORM Data Mapper model via custom repositories or native EntityManager dependencies.

---

## 12. Service Rules

* **Single Functional Focus:** Services MUST contain stateless processing rules and transaction limits. No HTTP request structures or raw socket payloads are allowed inside service layers.
* **State Injection Constraints:** Services MUST remain entirely stateless. Member properties on standard scoped singleton instances MUST NOT retain user-specific data during operational intervals.

---

## 13. Controller Rules

* **Minimal Logic:** Controller methods MUST act as straightforward protocol routers. No business rules, complex validation calculations, or database alterations are allowed within a controller method.
* **Clean Contract Serialization:** Controllers MUST rely completely on global interceptors to cleanly process and format outward HTTP response codes and structures.

---

## 14. Authentication Flow

```
Client                      AuthGateway                    Database
  │                              │                            │
  │─── POST /auth/login ────────►│                            │
  │    (Credentials)             │─── Verify User Check ─────►│
  │                              │◄── Return Password Hash ───│
  │                              │                            │
  │                              │─── Store Session Token ───►│
  │◄── Set HttpOnly Cookies ─────│                            │
  │    (Access & Refresh Tokens) │                            │

```

1. The client MUST submit secure identifiers exclusively over an encrypted HTTPS connection.
2. The authorization service MUST fetch user metadata alongside salted password fields from storage.
3. The server MUST generate twin JWT items: a short-lived `AccessToken` and an isolated `RefreshToken`.
4. The system MUST compute a one-way secure hash of the `RefreshToken` and save it directly inside the target database.
5. Outbound responses MUST embed token structures inside `HttpOnly`, `Secure`, `SameSite=Strict` browser storage configurations.

---

## 15. Device Registration Flow

1. An operator MUST pass a targeted physical device hardware identifier (MAC or Unique Chip ID) into the registration system dashboard.
2. The platform core MUST cross-match the submitted target signature against an authorized physical inventory table.
3. Upon validation, the engine MUST generate a strong device-scoped cryptographic credential pair (`Client-ID` and `Secret-Key`).
4. The system MUST save the encrypted device hash to disk while setting the initial operational status flag to `PENDING_PROVISION`.

---

## 16. Device Validation Flow

1. Upon initial communication boot, a hardware device MUST initiate a handshake using its assigned cryptographic credential values.
2. The core security provider MUST validate the signature against active internal authorization records.
3. The authentication handler MUST verify that the underlying software firmware match the approved parameters.
4. If validation parameters match completely, the connection state MUST shift to `ONLINE`. If any criteria fail, the system MUST drop the socket link immediately and trigger a high-severity security alert.

---

## 17. mYBUS-v2 Protocol Overview

The system relies on an optimized application-layer binary configuration protocol known as `mYBUS-v2`. It handles data streaming across edge infrastructure topologies using fixed-length frame sequences.

### 17.1. Frame Definition Matrix

All telemetry data transfers, error messages, and control signals transmitted using the `mYBUS-v2` structure MUST strictly conform to the following byte frame allocation scheme:

| Byte Segment Offset | Data Content Definition | Field Constraints & Technical Requirements |
| --- | --- | --- |
| `0x00` | **Frame Sync Character** | MUST be explicitly set to the static hex signature `0xAA`. |
| `0x01` | **Protocol Variant Identification** | MUST evaluate to the static hex marker `0x20` (v2.0). |
| `0x02` - `0x03` | **Target Device Hardware Address** | Big-endian 16-bit integer designating physical node ID. |
| `0x04` | **Functional Instruction Type** | Single-byte identifier command routing code. |
| `0x05` | **Data Payload Length Field** | Single-byte integer defining explicit payload buffer size. |
| `0x06` - `0x15` | **System Data Payload Area** | Fixed 16-byte field containing real-time values. |
| `0x16` - `0x17` | **Cyclic Redundancy Validation Code** | Mandatory 16-bit CRC checksum calculation parameter. |

---

## 18. Security Principles

* **Principle of Least Privilege:** Every internal system interface, worker queue, and software module actor MUST operate with the bare minimum permission footprint needed to execute its logic.
* **Zero-Trust Networking Layer:** Internal network paths between backend nodes, API routers, and microservice components MUST authenticate each transaction packet explicitly.
* **Comprehensive Data Scrubbing:** All input vectors originating outside a microservice trust zone MUST undergo string sanitation and explicit whitelist-based schema filtering before reaching processing tasks.

---

## 19. Cryptography Rules

* **Secret Hashing Parameters:** Passwords stored in database environments MUST use the Argon2id cryptographic derivation framework. Configuration factors MUST NOT fall below the following thresholds:
* Memory footprint: $m = 65536 \text{ KiB}$
* Time iterations: $t = 3$
* Parallel channels: $p = 4$


* **Data Masking Keys:** Stored variables requiring reverse reading processing capabilities MUST use AES-256-GCM symmetric encryption pipelines. Initialization Vector components (`IV`) MUST be non-repeating and cryptographically random for every execution run.

---

## 20. Transaction Rules

* **Strict Operational Isolation:** Database mutations affecting fiscal metrics, user account properties, or structural physical system mappings MUST run under isolated TypeORM relational engine transaction states.
* **Deterministic Timeout Boundaries:** Every long-lived database transaction lock instance MUST register an explicit cancellation limit of 5000 milliseconds. Transactions exceeding this limit MUST abort automatically, perform a rolling undo sequence, and log a high-priority exception trace.

---

## 21. Database Design Rules

* **Enforcement of Foreign Key Consistency:** Relational continuity across distinct tables MUST be bound firmly via native engine foreign-key constraints. No logic-level "virtual" data links are permitted.
* **Mandatory Query Performance Indexing:** Query filters matching unique ID tracking properties, composite conditional logic paths, or search target properties MUST utilize clear indexing structures.
* **Normalization Conformity:** Tables MUST sustain Third Normal Form (3NF) layout structures. Intentional denormalization optimizations for speed improvements MUST require explicit analytical benchmarking results before adoption.

---

## 22. Error Handling

* **Zero Raw Leakage:** Stack execution contexts, variable dumps, or storage-level infrastructure logs MUST NOT be exposed on outbound API endpoints.
* **Universal Typification:** Exceptional states raised during routine operations MUST extend from a structural core error class definition (`AppException`). This guarantees predictable parsing across external system components.

---

## 23. Logging Strategy

* **JSON Formatting Requirement:** Production system environment logging engines MUST format runtime status indicators directly into single-line structured JSON data structures.
* **Trace Context Continuation:** Incoming request threads crossing systemic microservice boundaries MUST transport an immutable correlation identifier token string (`X-Correlation-ID`) across all log outputs.
* **Log Level Definition:**
* `FATAL`: Systemic failure rendering the microservice completely non-operational. Immediate paging required.
* `ERROR`: Local transactional failure or structural exception. Requires investigation.
* `WARN`: Non-optimal execution paths or deprecated API requests.
* `INFO`: High-level operational checkpoints (e.g., application startup, migration success).



---

## 24. Docker Architecture

* **Minimal Distro Blueprint:** System deployment instances MUST construct execution containers using verified minimal, low-vulnerability Base images (e.g., `node:18-alpine` or `python:3.11-alpine`).
* **Multi-Stage Container Compilations:** Service builds MUST split processing steps via multi-stage files. Build tools, development setups, and source cache layers MUST be completely omitted from the final runtime image footprint.
* **Non-Root Privilege Mode:** Container runtimes MUST explicitly declare dropping root context flags before startup. The entrypoint runtime MUST use an isolated unprivileged user profile.

---

## 25. Future Scalability

* **State-Free Horizontal Growth:** Microservice applications MUST be fully stateless to support horizontal scaling. Session profiles, transient data metrics, and global state tracking parameters MUST reside exclusively inside shared cache engines like Redis.
* **Database Read-Write Separation:** Storage configurations SHOULD support a split topology with one primary database cluster managing write operations alongside multiple synchronized, read-only replica instances.

---

## 26. Testing Strategy

* **Minimum Coverage Floors:** Continuous Integration workflows MUST reject pull-request builds if global unit test branch metric tracking falls under a strict 80% boundary line.
* **Complete Mocking Isolation:** Unit test routines MUST NOT form live outbound connections to external storage engines or external API systems. All network, message queue, and database components MUST rely completely on mocked test doubles.

---

## 27. CI/CD Rules

* **Immutable Pipeline Progression:** Code compilation outputs from successful build phases MUST be packed into tagged Docker configurations. These exact compiled artifacts MUST progress through all staging tiers unmodified.
* **Automated Validation Barriers:** Main application branch deployment actions MUST require complete success across automated lint check suites, unit testing matrices, and integration test runners.

---

## 28. API Design Standards

* **RESTful Blueprint Conformity:** Internal HTTP endpoints MUST enforce strict REST convention mechanics. Entity collections MUST rely on plural nouns (`/api/v1/devices`), and state operations MUST utilize proper HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
* **Mandatory API Version Routing:** API paths MUST embed explicit api-version parameters into the route base structure (`/api/v1/...`).

---

## 29. Performance Guidelines
* **Memory Profiling Constraints:** Core Node.js execution threads running inside backend tasks MUST maintain an idle heap footprint below 150 Megabytes.
* **Caching Strategy:** High-frequency, slow-changing database queries (e.g., structural device lists or organization profiles) MUST be cached in Redis with a Time-To-Live (TTL) value not exceeding 300 seconds.

---

## 30. Things That Must NEVER Be Changed
* **Binary Frame Synch Signatures:** The mYBUS-v2 protocol initialization signature (`0xAA`) and internal layout order MUST NOT be changed or reallocated.
* **Token Delivery Mechanism:** Outbound user session access and refresh token objects MUST always rely on strict server-side cookie structures. They MUST NOT be moved to plain authorization payload texts or custom application headers.
* **Primary Database Technology Selection:** PostgreSQL is the only approved primary persistent data store. It MUST NOT be replaced with NoSQL engines or alternative relational database runtimes.
* **Entity Identification Formats:** System primary key indices MUST utilize structural UUIDv4 values. Under no circumstances should integer-based auto-increment structures replace them.

