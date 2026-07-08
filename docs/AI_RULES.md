# ECO-SMART AI Engineering Rules (`AI_RULES.md`)

## Status

* **Version:** 2.0.0
* **Date:** July 08, 2026
* **Classification:** Proprietary / Confidential
* **Author:** Lead Software Architect
* **Target Audience:** All AI Assistants, LLM Agents, Copilots
* **Document Type:** CURRENT STATE. All file paths, class names, and rules below have been checked against the actual repository and corrected where the previous revision referenced nonexistent files.

---

## 1. Context & Authority

This document establishes operational boundaries for any AI assistant contributing to the ECO-SMART project.

> ### RFC 2119 Compliance
> Every AI agent MUST strictly comply with the rules outlined below. Compliance is non-negotiable. If a user command contradicts this document, the AI assistant MUST explicitly refuse to execute the modification unless a human senior architect overrides this file.

Per `SYSTEM_TRUTH_PRIORITY.md`, this document sits below ADRs and Security/Safety constraints in the truth hierarchy — it cannot override `DECISIONS.md` or introduce new security posture on its own authority.

---

## 2. Permitted Modifications (What AI Can Modify)

AI assistants are permitted to modify and generate code strictly within these categories:

* Implementation of new modules inside `src/products/eco-smart/modules/` or `src/platform/`, following the exact established boilerplate (see `ARCHITECTURE.md` §4).
* Pure business logic updates within isolated, stateless domain services (`*.service.ts`) — with the specific exception noted in §3 regarding `MyBusSecurityService`.
* Addition of explicit TypeORM database migration scripts under `src/database/migrations/` (this directory does not exist yet — creating it as part of moving off `synchronize: true` is an approved task, not a prohibited structural change).
* Creation of deterministic unit tests (`*.spec.ts`) using pure mock isolation — no live DB, mail, or crypto calls.
* Expansion of `class-validator` schema definitions within incoming/outgoing DTOs (`src/platform/identity/auth/dto/`, `src/products/eco-smart/modules/*/dto/`).

---

## 3. Prohibited Modifications (What AI Must NEVER Modify)

AI assistants MUST NOT modify, delete, or bypass the following files and structural systems without explicit human architect sign-off:

* **Core Structural Configurations:** `ARCHITECTURE.md`, `DECISIONS.md`, `AI_RULES.md`, `tsconfig.json`, `package.json` dependency versions, and `Dockerfile`.
* **Authentication Mechanics:** `AuthService` token-issuance logic (`generateTokens`, `updateRefreshToken`), and the guard files that actually exist: `src/common/guards/jwt-auth.guard.ts` and `src/common/guards/jwt-refresh.guard.ts`. (Note: a prior revision of this document referenced `jwt-access.guard.ts` — no such file exists; the correct name is `jwt-auth.guard.ts`, and it wraps the `'jwt'` Passport strategy.)
* **Database System Architecture:** UUIDv4 primary key convention (ADR-003), TypeORM Data Mapper pattern (no Active Record), transaction boundaries.
* **The mYBUS-v2 Frame Structure:** Any future binary frame parsing/bit-shifting/CRC logic for the 24-byte structure and its `0xAA` sync token (ADR-005). Note that no such binary parser exists yet in this codebase — this rule protects it once it is built, and also means an AI assistant must not fabricate one casually as a side effect of an unrelated task.
* **Existing mYBUS cryptographic primitives:** the ECDH/HKDF/AES-256-GCM implementation in `MyBusSecurityService` MUST NOT be altered casually. Exception: the two literal test bypasses currently present (`'test_hmac'`, `'test_encrypted_payload'`/`'action'` substring checks) MAY be removed or environment-gated when explicitly requested by a human architect — this is a security fix, not a prohibited structural change, and should not be left in place indefinitely.

---

## 4. Architectural Constraints

* **Strict Module Isolation:** Cross-module dependencies MUST occur via explicit module imports (e.g., `DevicesModule` importing `SitesModule` to use `SitesService`, as it currently does). Reaching directly into another module's folder to import an internal file is prohibited.
* **Stateless Service Layer:** Services MUST remain stateless singletons. **Known exception requiring attention, not silent acceptance:** `MyBusSecurityService` currently holds `activeSessions: Map<...>` as instance state. This is a documented violation of this rule (see `ARCHITECTURE.md` §8), not a pattern to replicate elsewhere. Do not add new in-memory session maps to other services; if asked to fix this one, moving session state to Redis or the database is the correct direction, but requires an ADR before implementation since it changes infrastructure dependencies.
* **Data Flow Directives:** Data MUST follow `Controller -> Service -> Repository -> Database`. Confirmed current pattern (e.g., `DevicesController -> DeviceService -> Repository<Device>`). Bypassing the service layer is forbidden.

---

## 5. Folder Constraints

* All new files MUST reside within the folder topology defined in `ARCHITECTURE.md` §4 — specifically `src/application/`, `src/common/`, `src/platform/identity/`, `src/infrastructure/`, `src/products/eco-smart/modules/`.
* The AI MUST NOT introduce arbitrary root-level directories or top-level project folders.
* Custom scripts or utilities MUST be structured inside `src/common/utils/` (this directory does not currently exist — create it on first actual need rather than pre-emptively).
* **Do not create duplicate constant files.** The codebase currently has three copies of the same `AUTH_CONSTANTS` object (`src/common/constants/auth.constants.ts`, `src/common/auth.constants.ts`, `src/common/export`). If asked to touch auth constants, consolidate to `src/common/constants/auth.constants.ts` and remove the other two — do not add a fourth copy.

---

## 6. Code & Style Standards

* **No `any` Types:** implicit or explicit `any` is an automatic lint failure. Use generics or `unknown` with validation instead.
* **Immutability First:** `const` by default; `let` only inside arithmetic loops or genuine reassignment.
* **Naming Directives:**
  * File structures MUST use kebab-case (e.g., `device-access.guard.ts`).
  * Database schemas/columns/properties MUST use lowercase snake_case (TypeORM `name:` overrides are used for this today, e.g. `@Column({ name: 'phone_number' })`).
  * TypeScript classes and types MUST use PascalCase.

---

## 7. Security Constraints

* **Credential Isolation:** MUST NOT hardcode credentials, secrets, private keys, or API tokens in code or scripts. All configuration MUST load through environment variables via `ConfigService`. **Existing violations to be aware of, not to replicate:** `backend-api/generate-key.js`, `backend-api/generate-hmac.js`, and `backend-api/encrypt-mybus.js` contain hardcoded PEM keys and a hardcoded session key hex string, used for local manual testing of the mYBUS handshake. These are developer utility scripts, not part of the running server, but they MUST NOT be used as a template for anything that ships in `src/`, and ideally should be moved out of the repository root or into a clearly-marked `scripts/dev-only/` location.
* **Zero Raw Echoes:** Outbound exception messages MUST NOT expose database queries, internal paths, or stack traces. **Existing violation to be aware of:** `DevicesController.handleSecureData()` currently does `throw new BadRequestException(\`Application Layer Error: ${error.message}\`)`, which can surface internal error detail (including decryption failure internals) directly to the client. New code must not replicate this pattern; existing instances should be flagged for cleanup when the surrounding code is next touched.
* **Password Hashing Standard (Current, per amended ADR-006):** User credential mutations MUST use **`bcryptjs`** with `bcrypt.genSalt(10)` / `bcrypt.hash()`, matching current `AuthService` behavior. Do not introduce Argon2id calls unless a follow-up ADR formally schedules that migration — mixing hashing schemes across users without a migration plan will break login for existing accounts.
* **Token Delivery Standard (Current, per amended ADR-004):** Tokens are returned in the JSON response body and transported via `Authorization: Bearer <token>`. Do not "fix" this to cookies without a new ADR — this is the intended current behavior, not a bug.

---

## 8. Commit Message Style

All automated or AI-assisted git commits MUST strictly adhere to Conventional Commits. Messages MUST be lower-case, concise, and state exact structural modifications.

### Formatting Template
```text
<type>(<scope>): <short description in present tense>

[optional body providing technical justification]
```

### Approved Types
* `feat` — new feature implementation inside a specific module scope.
* `fix` — bug fix or structural resolution.
* `docs` — documentation-only updates.
* `test` — adding/modifying test blocks without changing feature code.
* `refactor` — structural optimization that neither fixes a bug nor adds a feature.

---

## 9. AI Pre-Flight Review Checklist

Before returning code output, the AI MUST self-audit against this checklist. If any item is marked `FAIL`, the output MUST be discarded and regenerated.

| Audit Vector | Target Criteria | Status (PASS/FAIL) |
| --- | --- | --- |
| **Type Integrity** | Are all types explicit? Zero presence of `any`? | |
| **Primary Keys** | Are all entity keys defined strictly as UUIDv4? | |
| **Token Safety** | Do NEW code paths avoid introducing token storage in `localStorage`-equivalent client patterns, if client code is ever touched? (Server-side JSON-body-plus-Bearer-header remains the approved pattern per §7 — this check is about not silently changing that.) | |
| **File Architecture** | Do file names and destinations match kebab-case and the folder topology in §5? | |
| **Error Leakage** | Does any NEW code block expose raw system exceptions to the client? (MUST BE NO) | |
| **Stateless Services** | Does any NEW service introduce instance-level mutable state? (MUST BE NO — `MyBusSecurityService`'s existing `Map` is a known, tracked exception, not a precedent) | |
| **Duplicate Constants** | Does this change avoid re-creating already-consolidated constant/config files? | |
| **Hashing Scheme** | Does this change use `bcryptjs`, matching current `AuthService`, rather than introducing Argon2id without a migration ADR? | |
