# SYSTEM_CONSTRAINTS.md

## Performance Budget

- API max latency: 200ms (95th percentile)
- Telemetry processing: < 250ms
- DB query max: 50ms average

---

## Memory Constraints

- Core service max heap: 150MB
- Gateway max heap: 100MB

---

## Network Constraints

- mYBUS frame size: 24 bytes fixed
- Max packet loss tolerated: 2%

---

## Concurrency Constraints

- Max device connections per node: 10,000
- Redis pub/sub latency threshold: 10ms

---

## Failure Model

- Gateway failure → load balancer reroute
- Redis failure → degraded buffer mode
- DB failure → read-only fallback