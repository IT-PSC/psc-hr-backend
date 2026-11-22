# PSC HR Backend

NestJS 11 + Prisma + PostgreSQL API for the [hr-system](../hr-system) SPA (PSC HR + Finance).

## Stack

| Layer | Choice |
|-------|--------|
| API | NestJS 11, REST, Swagger |
| DB | PostgreSQL + Prisma |
| Jobs | BullMQ + Redis |
| Auth | JWT access + refresh, demo 2FA |
| TZ | Asia/Phnom_Penh |

## Quick start

```bash
# Infra
docker compose up -d postgres redis

cp .env.example .env
# DATABASE_URL host port is 5434 (compose mapping). Set REDIS_ENABLED=false to boot without Redis.

npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

| URL | Purpose |
|-----|---------|
| http://localhost:3001/api | API base |
| http://localhost:3001/api/docs | Swagger UI |
| http://localhost:3001/api/docs-json | OpenAPI JSON |
| http://localhost:3001/api/health | Health |

SPA:

```bash
# hr-system/.env
VITE_API_BASE_URL=http://localhost:3001/api
```

## Demo logins

| Email | Password | Roles |
|-------|----------|-------|
| `admin@psc.local` | `Password123!` | system_admin, employee |
| `hr@psc.local` | `Password123!` | hr, employee |
| `finance@psc.local` | `Password123!` | finance_manager, employee |
| `manager@psc.local` | `Password123!` | manager, employee |
| `employee@psc.local` | `Password123!` | employee |

Privileged roles receive a **2FA challenge** on login. Demo OTP: `123456`.

Employee IDs match SPA personas (`emp-01`, `emp-04`, `emp-06`, `emp-03`, `emp-10`).

## Auth flow

1. `POST /api/auth/login` → tokens **or** `{ requires2FA, challengeToken }`
2. `POST /api/auth/2fa/verify` with OTP
3. `Authorization: Bearer <accessToken>` on subsequent calls
4. `POST /api/auth/refresh` / `POST /api/auth/logout`

RBAC uses the same Module × Action × Scope matrix as the SPA (`src/common/roles`).

## Money bridges

| Action | Event | Finance result |
|--------|-------|----------------|
| `POST /api/payroll-psc/runs/:id/approve-md` | `payroll.psc.approved` | draft `FinPayrollPosting` |
| `POST /api/accounts-payable/requests/:id/approve` (USD) | `ap.document.approved` | draft `FinApPaymentProposal` |

Events are idempotent via `IntegrationEvent.eventId`.

## Workers

With `REDIS_ENABLED=true` and Redis up:

- Queues: `punch-reminders`, `telegram`, `exports`
- Enqueue: `POST /api/workers/*`
- See `src/workers/README.md`

`TELEGRAM_BOT_TOKEN` stays in backend `.env` only — never in the SPA.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | API watch mode |
| `npm run build` | Compile |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | Seed demo users + permissions |
| `docker compose up -d` | Postgres + Redis |

## Env

See `.env.example` for `DATABASE_URL`, `JWT_*`, `REDIS_*`, `SWAGGER_ENABLED`, `TELEGRAM_BOT_TOKEN`.
