# DEPLOYMENT.md

## Environments

- development
- staging
- production

---

## Stack

- FastAPI Gateway
- NestJS Core
- PostgreSQL
- Redis Cluster
- Docker

---

## Scaling Strategy

- Gateway: horizontal scaling
- Core: horizontal scaling
- DB: primary + replicas

---

## Deployment Rules

- zero downtime deployment
- immutable containers
- no runtime patching

---

## CI/CD Pipeline

1. lint
2. type check
3. test
4. build docker
5. security scan
6. deploy staging
7. approval
8. production