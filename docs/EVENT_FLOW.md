# EVENT_FLOW.md

## Event Backbone

All system events MUST pass through Redis Pub/Sub.

---

## Event Types

- device.registered
- device.online
- telemetry.received
- alarm.triggered
- ota.update.started

---

## Flow Rules

Device → Gateway → Event Bus → Consumers

---

## Guarantees

- At-least-once delivery
- Idempotency required on all consumers
- No ordering guarantee across device streams