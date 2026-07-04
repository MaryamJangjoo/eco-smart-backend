# DATABASE.md

## Engine
PostgreSQL only

---

## Design Rules

- UUIDv4 primary keys
- 3NF normalization required
- No Active Record pattern

---

## Tables

### devices
- id
- room_id
- mac_address
- status

### telemetry
- id
- device_id
- timestamp
- payload

---

## Indexing Rules

- device_id indexed
- timestamp indexed for telemetry

---

## Transaction Rules

- max transaction time: 5s
- rollback on timeout