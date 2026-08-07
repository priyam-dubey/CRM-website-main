# BookingCRM — Backend

## Quick Start

### Option A: Docker (recommended)

```bash
cd docker
docker-compose up -d postgres redis
```

```bash
# Copy and configure env
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed

# Start dev server
npm run start:dev
```

API available at: **http://localhost:4000/api/v1**

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| admin@demo.com | password | Admin |
| manager@demo.com | password | Manager |
| operator@demo.com | password | Operator |

---

## Key Endpoints

```
POST   /api/v1/auth/login          # Login → returns accessToken + sets cookie
POST   /api/v1/auth/refresh        # Rotate refresh token
POST   /api/v1/auth/logout         # Revoke session

GET    /api/v1/bookings            # Paginated booking list
POST   /api/v1/bookings            # Create booking
GET    /api/v1/bookings/:id        # Booking detail
PATCH  /api/v1/bookings/:id        # Update booking

GET    /api/v1/revenue/dashboard   # Revenue dashboard data
GET    /api/v1/revenue             # Revenue entries
GET    /api/v1/revenue/chargebacks # Chargebacks
GET    /api/v1/revenue/refunds     # Refunds
GET    /api/v1/revenue/mcos        # MCOs

GET    /api/v1/users               # User list (Admin/Manager)
GET    /api/v1/users/me            # Current user

GET    /api/v1/security/ip-rules   # IP rules
GET    /api/v1/security/logs       # Security event log
GET    /api/v1/security/sessions   # Active sessions

GET    /api/v1/activity            # Audit trail (cursor paginated)

GET    /api/v1/search/global?q=    # Global search

GET    /api/v1/manage/airlines     # + classes, currencies, providers, card-processors, call-queues

GET    /api/v1/notifications       # User notifications
```

---

## Architecture

- **NestJS** with global JWT guard, permissions guard, IP guard, throttle guard
- **Prisma ORM** with soft deletes, optimistic locking, and automatic timestamps
- **PostgreSQL** — all monetary values stored as integer cents
- **RBAC** — permissions encoded in JWT payload, enforced server-side on every route
- **Audit logging** — non-blocking `setImmediate()` writes for every mutation
- **Event-driven** — domain events via `@nestjs/event-emitter` for cross-module communication
- **Multi-tenant ready** — every query scoped by `companyId` extracted from JWT

## Environment Variables

See `.env.example` for all required variables.
