# ECO-SMART Architectural Decisions Log (ADR)

## Status

* **Version:** 1.0.0
* **Date:** June 29, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Lead Software Architect
* **Target Audience:** Engineering Teams, AI Coding Assistants, System Integrators

---

## ADR-001: Selection of Primary Persistent Database Engine

* **Date:** October 12, 2025
* **Status:** APPROVED / IMMUTABLE

### Decision

PostgreSQL MUST be used as the exclusive primary relational database engine for all persistence requirements across the ECO-SMART system.

### Reason

The platform demands strict ACID compliance, advanced relational constraint handling, and native support for transactional data structures. PostgreSQL provides superior indexing capabilities, production-grade reliability, and high-performance throughput under complex concurrent foreign-key joining conditions.

### Alternatives

* MongoDB (Rejected: Inadequate relational validation constraints and lack of rigid structural transaction consistency guarantees).
* MySQL (Rejected: Suboptimal handling of heavy concurrent read-write scaling patterns and weaker transactional isolation mechanics).

### Trade-offs

* **Pros:** Complete relational integrity, robust transaction handling, native support for JSONB operations, and extensive indexing strategies.
* **Cons:** Requires active database administration for connection pooling and memory tuning under heavy load; manual horizontal partitioning strategy overhead.

### Impact

All relational schemas, migrations, and database connection profiles MUST target PostgreSQL exclusively. No abstract wrappers allowing seamless swap-outs to NoSQL engines are permitted.

---

## ADR-002: Framework Selection for Core Backend Application

* **Date:** October 14, 2025
* **Status:** APPROVED

### Decision

NestJS (Node.js framework) MUST be utilized to implement the main application logic, core business services, and public API routers.

### Reason

NestJS enforces a highly structured, enterprise-grade architecture out of the box using dependency injection. This strict folder and module organization guarantees code maintainability and standardizes development patterns across scaling engineering teams.

### Alternatives

* Express.js (Rejected: Lacks architectural structure; patterns easily degrade into unmaintainable, non-standard codebases in large applications).
* Fastify standalone (Rejected: Better raw throughput but lacks built-in architectural patterns, dependency injection engines, and module encapsulation).

### Trade-offs

* **Pros:** Predictable modular design, native dependency injection container, type safety, and seamless integration with the TypeScript ecosystem.
* **Cons:** Higher initial learning curve and slightly increased runtime overhead compared to ultra-minimal frameworks.

### Impact

All core enterprise backend logic MUST be written within NestJS modules, utilizing its native providers, guards, interceptors, and pipes.

---

## ADR-003: Architectural Primary Key Structure Identification

* **Date:** November 03, 2025
* **Status:** APPROVED / IMMUTABLE

### Decision

Every database entity table mapped by TypeORM MUST employ Universally Unique Identifiers (UUIDv4) as its primary key cluster identification column.

### Reason

Using UUIDv4 isolates ID generation mechanics from the database runtime engine. This completely prevents identifier collision risks during data migrations, system sharding, or decoupled client-side tracking configurations.

### Alternatives

* Auto-incrementing Integers / BigInt (Rejected: Exposes total resource counts via URLs and introduces sequencing bottlenecks during distributed data merges).

### Trade-offs

* **Pros:** Complete decentralized key generation safety, zero exposure of business volume metrics via endpoints, and trivial database merging.
* **Cons:** Increased index size (128-bit vs. 64-bit BigInt) which impacts memory usage and slows down index insertion operations on large tables.

### Impact

All entities MUST declare UUIDv4 primary keys. Serialized integer IDs are strictly prohibited on all data tables.

---

## ADR-004: Token Transmission Security Protocol

* **Date:** December 05, 2025
* **Status:** APPROVED / IMMUTABLE

### Decision

Outbound JWTs (Access and Refresh tokens) MUST be delivered exclusively via server-set `HttpOnly`, `Secure`, `SameSite=Strict` browser cookies.

### Reason

Storing cryptographic access tokens inside standard browser local storage configurations exposes the application to severe token theft via Cross-Site Scripting (XSS) injection routes. Forcing browser cookie management completely mitigates local script access to authorization signatures.

### Alternatives

* LocalStorage / SessionStorage payload handling (Rejected: High vulnerability to XSS exploits).
* Custom Authorization Headers (Rejected: Requires client-side script storage, exposing the signature to the same XSS vulnerabilities).

### Trade-offs

* **Pros:** Complete elimination of JavaScript-based token extraction attacks (XSS isolation).
* **Cons:** Requires mitigation strategies for Cross-Site Request Forgery (CSRF) and complicates cross-domain token consumption.

### Impact

Controllers and Gateway components MUST NOT return token fields inside plain JSON response bodies. Frontend client setups MUST rely on automatic browser cookie transport mechanics.

---

## ADR-005: mYBUS Protocol Evolution and Synchronization Format

* **Date:** June 15, 2026
* **Status:** APPROVED / IMMUTABLE

### Decision

The hardware messaging engine MUST use the `mYBUS-v2` protocol specification, enforcing a hard-coded 24-byte binary frame structure initialized by a static sync marker `0xAA`.

### Reason

Edge automated controllers operate with limited processing power and strict network bandwidth limits. A highly optimized, static-length binary frame format guarantees predictable memory footprints and allows fast, deterministic bit-shifting parse loops within the microservice boundary.

### Alternatives

* JSON over MQTT (Rejected: Extreme parsing and allocation overhead on low-power edge microcontrollers; high bandwidth consumption).
* Protobuf over gRPC to the Edge (Rejected: High transport stack complexity; unsupported by low-level edge networking hardware chipsets).

### Trade-offs

* **Pros:** Maximum processing efficiency, zero heap fragmentation during low-level parse loops, and minimal network overhead.
* **Cons:** Complete loss of human readability without dedicated debugging tools; structural changes require global system coordination.

### Impact

The mYBUS parsing microservice MUST strictly validate the `0xAA` marker at byte offset zero. Deviations or frame padding variations outside the 24-byte threshold MUST drop the network packet instantly.

---

## ADR-006: Cryptographic Password Storage Parameters

* **Date:** June 22, 2026
* **Status:** APPROVED

### Decision

User authentication password strings MUST be securely processed using the Argon2id cryptographic password hashing algorithm with static operational resource locks.

### Reason

Argon2id is the industry standard for secure hashing, providing strong resistance against GPU-accelerated brute-force attacks and side-channel attacks through balanced time, memory, and parallel thread limits.

### Alternatives

* BCrypt (Rejected: Vulnerable to highly accelerated hardware brute-forcing arrays due to missing configurable memory-hardness constraints).
* SHA-256 (Rejected: Extremely fast execution speeds allow trivial brute-force table attacks; completely insecure for user credential storage).

### Trade-offs

* **Pros:** Configurable defense parameters against specialized hardware brute-forcing operations.
* **Cons:** Higher computational resource usage on authentication servers during parallel user logging spikes.

### Impact

The `AuthModule` hashing pipeline MUST enforce: $m=65536 \text{ KiB}$, $t=3$ iterations, and $p=4$ parallel lanes. No weaker configuration values are acceptable.
