---

# 🧠 ECO-SMART SYSTEM_TRUTH_PRIORITY.md

## Status

* **Version:** 1.0.0
* **Date:** July 01, 2026
* **Classification:** Proprietary / System Critical
* **Author:** Principal System Architect
* **Purpose:** Define authoritative precedence between all system specifications

---

# 1. Purpose

This document defines the **single source of truth hierarchy** for all ECO-SMART engineering artifacts.

> In case of any contradiction between system documents, this file determines the final authority.

---

# 2. Core Principle

> The system is documentation-driven. Code is a runtime implementation of documented truth.

However:

> When documentation conflicts exist, a strict priority resolution MUST be applied.

---

# 3. Truth Hierarchy (Absolute Priority Order)

```text id="truth-order"
1. SECURITY & SAFETY CONSTRAINTS (Global Hard Rules)
2. ADR (Architectural Decision Records)
3. SYSTEM_TRUTH_PRIORITY.md (This Document)
4. ARCHITECTURE.md
5. API_SPEC.md
6. SEQUENCE_DIAGRAMS.md
7. AI_RULES.md
8. Implementation Code (Lowest Authority)
```

---

# 4. Explanation of Layers

## 4.1 SECURITY & SAFETY (HIGHEST AUTHORITY)

These rules override EVERYTHING.

Includes:

* Cryptography rules (AES-256-GCM, Argon2id)
* Token handling rules
* Data leakage prevention
* mYBUS-v2 immutability (security-related parts)

> If security is impacted → ALL other documents are invalidated.

---

## 4.2 ADR (Architectural Decisions)

ADR defines **why the system is designed the way it is**.

* Database selection
* Framework selection
* Protocol decisions
* Core system boundaries

> ADR overrides architecture, API, and sequence definitions.

---

## 4.3 SYSTEM_TRUTH_PRIORITY.md

This document itself defines:

* conflict resolution rules
* hierarchy model
* override logic

> It only governs interpretation, not implementation.

---

## 4.4 ARCHITECTURE.md

Defines:

* system structure
* module boundaries
* service responsibilities
* topology

> Must conform to ADR and Security layer.

---

## 4.5 API_SPEC.md

Defines:

* external contract
* request/response formats
* HTTP semantics

> Must align with architecture and ADR.

---

## 4.6 SEQUENCE_DIAGRAMS.md

Defines:

* runtime behavior
* temporal interaction flows
* event sequencing

> Must align with API_SPEC and ARCHITECTURE.

---

## 4.7 AI_RULES.md

Defines:

* AI behavior constraints
* code generation rules
* forbidden operations

> Cannot override any higher-level document.

---

## 4.8 CODE (LOWEST AUTHORITY)

Implementation must:

* obey ALL above layers
* never redefine architecture or contracts
* never override ADR or security rules

---

# 5. Conflict Resolution Rules

## Rule 1 — Security Dominance

If any conflict involves:

* encryption
* authentication
* authorization
* data leakage

→ SECURITY RULES WIN ALWAYS

---

## Rule 2 — ADR Dominance

If design conflict exists between:

* architecture vs API
* architecture vs sequence
* implementation vs design

→ ADR is final authority

---

## Rule 3 — External Contract Stability

API_SPEC can only be changed if:

* ADR explicitly allows modification
* backward compatibility is maintained

---

## Rule 4 — Runtime Behavior Consistency

SEQUENCE_DIAGRAMS must:

* follow API_SPEC
* follow ARCHITECTURE
* never introduce new entities

---

## Rule 5 — AI Rules Constraint

AI_RULES:

* cannot override ADR
* cannot override SECURITY
* cannot modify architecture without ADR

---

# 6. Override Mechanism (Controlled Evolution)

No system rule is permanently frozen.

However, modification MUST follow:

```text id="override-flow"
1. Create ADR proposal
2. Validate impact across all documents
3. Update ARCHITECTURE if needed
4. Update API_SPEC if affected
5. Update SEQUENCE_DIAGRAMS if runtime changes
6. Update AI_RULES last (if required)
```

---

# 7. System Integrity Rule

The system is considered **INVALID STATE** if:

* API_SPEC contradicts ARCHITECTURE without ADR approval
* SEQUENCE_DIAGRAMS introduce undefined APIs
* AI_RULES override ADR decisions
* Security rules are bypassed anywhere

---

# 8. Enforcement Philosophy

This system is designed to be:

> “Self-consistent by design, not by runtime correction.”

Meaning:

* errors must be prevented at design time
* not patched during execution

---

# 9. Final Statement

> If a rule is not consistent with higher priority layers, it is ignored at runtime and flagged as architectural drift.

---

# 🚀 نتیجه معماری این فایل

با اضافه شدن این فایل، سیستم تو الان تبدیل شد به:

```text id="final-state"
Documentation-driven distributed system
+ strict precedence governance
+ AI enforceable architecture rules
+ deterministic design hierarchy
```

---
