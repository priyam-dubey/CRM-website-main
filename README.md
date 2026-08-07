# BookingCRM — Full Stack

## Quick Start: Two terminals

### Terminal 1 — Backend
```bash
cd crm-backend

# First time only:
cp .env.example .env
npm install
# (Requires PostgreSQL running — see Docker section below)
npm run db:generate
npm run db:migrate
npm run db:seed

# Start:
npm run start:dev
# → http://localhost:4000/api/v1
```

### Terminal 2 — Frontend
```bash
cd crm-frontend

# First time only:
npm install

# Start (connected to backend):
npm run dev
# → http://localhost:3000
```

**Demo login:** admin@demo.com / password

---

## Quick Start: Docker (everything in one command)

```bash
cd crm-fullstack
docker-compose up
```

After containers start, run migrations once:
```bash
docker-compose exec backend npm run db:migrate
docker-compose exec backend npm run db:seed
```

Then open http://localhost:3000

---

## Frontend-only (no backend needed)

```bash
cd crm-frontend
cp .env.mock .env.local
npm run dev
```

This uses mock data — no database, no backend. Perfect for UI development.

---

## Environment Variables

### Frontend (`crm-frontend/.env`)
| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` | Backend API URL |
| `VITE_USE_MOCK` | `false` | Use mock data instead of real backend |

### Backend (`crm-backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | ✓ | JWT signing secret (min 32 chars) |
| `REFRESH_TOKEN_SECRET` | ✓ | JWT refresh secret (min 32 chars) |
| `ACCESS_TOKEN_EXPIRY` | — | Default: `15m` |
| `REFRESH_TOKEN_EXPIRY` | — | Default: `7d` |
| `CORS_ORIGINS` | — | Allowed origins, comma-separated |

---

## Architecture Summary

```
crm-frontend/          React 19 + TypeScript + Vite
  src/
    features/          Domain pages with TanStack Query hooks
    services/          Typed Axios service functions (1 per module)
    hooks/             Shared React hooks
    lib/               API client, query client, utilities
    components/        UI primitives + app composites

crm-backend/           NestJS + TypeScript
  src/
    modules/           auth, users, bookings, revenue, security,
                       activity, notifications, search, manage
    common/            Global guards, interceptors, filters, pipes
    shared/            Types, utilities, constants
    database/          PrismaService
  prisma/
    schema.prisma      Single source of truth for all data shapes
    seed/              Demo data seeder
```

## API Endpoints

All routes under `http://localhost:4000/api/v1/`

| Route | Description |
|---|---|
| `POST /auth/login` | Login → accessToken + HttpOnly cookie |
| `POST /auth/refresh` | Silent token rotation |
| `GET  /bookings` | Paginated booking list with filters |
| `POST /bookings` | Create booking (also creates revenue entry) |
| `GET  /revenue/dashboard` | Revenue totals + chart data |
| `GET  /activity` | Cursor-paginated audit trail |
| `GET  /search/global?q=` | Search across bookings, users, airlines |
| `GET  /manage/airlines` | Reference data (all 6 entity types) |
| `GET  /notifications` | User notifications with unread count |
| `GET  /security/ip-rules` | IP allow/deny rules |

## Data Flow

```
User action (form submit, button click)
    ↓
React Hook Form / event handler
    ↓
useMutation() / useQuery() (TanStack Query)
    ↓
Service function (bookingService.create, etc.)
    ↓
Axios API client (adds Bearer token, handles 401 refresh)
    ↓
NestJS Controller (validates JWT, checks permissions)
    ↓
NestJS Service (business logic, optimistic locking)
    ↓
Prisma Repository (typed DB queries, soft-delete filter)
    ↓
PostgreSQL
    ↓
Response → TanStack Query cache update → React re-render
```
