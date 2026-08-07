# CRM — Implementation & Deployment Guide

This document tells another developer everything needed to run, understand, and deploy
this CRM to production. It assumes familiarity with Node.js, Postgres, and basic Linux
server administration, but not with this specific codebase.

---

## 1. Project Overview

A multi-tenant (single-company-per-tenant via `companyId`) travel-agency CRM:

- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL, JWT auth (access + refresh tokens,
  httpOnly cookie refresh), role-based permissions (ADMIN / MANAGER / OPERATOR).
- **Frontend**: React 19 + Vite 5 + TypeScript, TanStack Query for data fetching,
  Tailwind CSS + shadcn/ui-style components, React Router 7.
- **Core domain**: travel **Bookings** (with airline, booking class, provider, card
  processor), **Revenue** (fare/tax/fee entries, MCOs, chargebacks, refunds), **Users**
  with role-based permissions, **Security** (IP allow/deny rules, session/activity logs),
  **Notifications**, global **Search**, and **Manage** (master/reference data: airlines,
  booking classes, providers, card processors, currencies, call queues).

Demo login after seeding: `admin@demo.com` / `password`.

## 2. Architecture

```
crm-backend/            NestJS API (port 4000 by default)
  src/modules/          one folder per domain module (auth, users, bookings, revenue,
                         security, activity, notifications, search, manage, health)
  src/common/           global guards, filters, interceptors, pipes, decorators
  src/database/         PrismaService (thin wrapper; degrades to a no-op client if the
                         Prisma engine binary isn't available, e.g. restricted-network CI)
  src/config/           typed env-driven config (app, database, jwt, throttle)
  prisma/schema.prisma  single Postgres schema, soft-delete (`deletedAt`) on all
                         business tables
  prisma/seed/          idempotent seed script (company, 3 demo users, all reference data)

crm-frontend/           React SPA (port 3000 in dev / behind Nginx in prod)
  src/features/         one folder per domain (mirrors the backend modules)
  src/hooks/, src/services/  TanStack Query hooks + axios-based API clients
  src/components/ui/    shared design-system primitives

crm-fullstack/          docker-compose.yml + setup.sh tying both apps + Postgres + Redis
                        together for local development
```

Requests flow: React → axios (`VITE_API_BASE_URL`) → Nest global guards
(`JwtAuthGuard` → `PermissionsGuard` → `IpGuard` → `ThrottlerGuard`) → controller → service
→ Prisma → Postgres. All mutating responses are audit-logged (`ActivityLog` table),
either inline in a `$transaction` (create paths) or via a fire-and-forget
`setImmediate` write (update/delete paths) that never blocks or fails the request.

Authorization: the JWT carries `role`; `ROLE_PERMISSIONS[role]` (a static map, see
`src/shared/constants/permissions.constants.ts`) is attached to the user object on both
login and `/users/me`, and read by the frontend's `usePermission(module, action)` hook to
show/hide/disable actions. The backend re-checks permissions independently via
`@RequirePermission()` + `PermissionsGuard` — the frontend check is UX only, never the
source of truth.

## 2.1 Booking transaction architecture (hybrid model)

**Why this exists.** The client's actual CRM (see the Aerodeals screenshots this project
was gap-analyzed against) models a booking as a *sequence of transactions* — New Booking,
Exchange, Cancel for Refund, Cancel for Future Credit, Upgrade, Baggage Add-On, Extra
Add-On, Seat Assignment, Ticket Reissuance — each with its own itinerary/passenger/
charges data, surfaced via a "Create Revision" action and a transaction-type badge on
every booking. The system this repo started from modeled a booking as a single flat
record with no transaction concept at all. Rebuilding the whole booking module to the
client's full model in one pass would have meant rewriting the booking repository,
service, every DTO, every booking page, and the `Revenue`/`MCO`/`Chargeback`/`Refund`
tables that key off `bookingId` — high risk, for a system that was otherwise already
working end-to-end.

**The decision (hybrid / additive).** `Booking` stays exactly as it was — the same
table, same fields, same repository, same service, same API responses. A new
`BookingTransaction` table was added alongside it:

```
Booking (unchanged)
    └── BookingTransaction[]   (new — exactly 1 row per booking today)
```

Every booking gets its `Transaction #1` created automatically and atomically (inside the
same DB transaction as the booking itself) — `BookingsService.create()` does this, and
the seed script does the equivalent directly since it creates bookings via Prisma rather
than through the service. `transactionType` defaults to `NEW_BOOKING` for any caller that
doesn't know about transactions yet (i.e. every pre-existing caller), and can be set
explicitly by new callers (e.g. a future transaction-type wizard). Existing bookings
created before this migration get a backfilled `Transaction #1` too (see the manual
migration's backfill `INSERT ... WHERE NOT EXISTS`).

**How future transaction types fit in.** `BookingTransaction` already has the shape a
real "Create Revision" feature needs — `(bookingId, transactionNumber)` is a unique
constraint, so a second call just inserts `transactionNumber = 2` against the same
booking, with whatever `transactionType`/`remarks`/`metadata` that revision represents.
`metadata` is an open `Json?` column deliberately, so type-specific payloads (new
itinerary for an Exchange, credit amount for a Future Credit, etc.) don't need their own
tables until there's a real need to query into them structurally. The `status` enum
(`DRAFT/IN_PROGRESS/COMPLETED/CANCELLED`) exists so a future multi-step wizard can persist
a transaction mid-flow before it's finalized — not used yet (today's single auto-created
transaction always lands as `COMPLETED`), but the column is there so adding that flow
later doesn't need another migration.

**What's implemented now vs. deferred:**
- ✅ Implemented: the `BookingTransaction` table, automatic Transaction #1 creation,
  `isUrgent` flag, transaction-type badge on Find Bookings, `transactionType` as an
  optional field on booking create.
- ⏸ Deliberately deferred: an actual "Create Revision" UI/API that appends
  `transactionNumber = 2, 3, ...`; the 7-section transaction wizard (Basic Details →
  Itinerary → Passenger → Billing & Payment → Charges & Fees → Special Details →
  Attachments) the client's UI shows; per-transaction-type sub-forms and validation.
  None of this is blocked architecturally — it's scoped out of this phase per the
  explicit "implement only the foundation" instruction, and the schema won't need to
  change again to add it.

## 3. Backend Setup

```bash
cd crm-backend
cp .env.example .env        # then edit secrets — see §8
npm install
npm run db:generate         # requires network access to binaries.prisma.sh
npm run db:migrate          # applies prisma/schema.prisma via migrations
npm run db:seed             # idempotent — safe to re-run
npm run start:dev           # http://localhost:4000/api/v1
```

> **Sandboxed/offline environments:** if `binaries.prisma.sh` isn't reachable, `prisma
> generate` fails and `PrismaService` logs a warning and falls back to a no-op client
> (see `src/database/prisma.service.ts`). This lets `tsc`, `eslint`, and the unit test
> suite run without a real database, but the API will not serve real data until the
> Prisma engine can be generated somewhere with network access — do this before shipping
> to any real environment.

## 3.1 Troubleshooting: port conflicts with other local services

If `crm-backend` won't bind (`EADDRINUSE`) or connects to the wrong Postgres/Redis
instance, another local service (a different project's Docker containers are a common
culprit) is likely already using ports `4000`, `5432`, or `6379`. This was hit and fixed
during real local testing of this project:

- Find what's holding a port: `netstat -ano | findstr :4000` (Windows) or
  `lsof -i :4000` (macOS/Linux), then check the owning process.
- Fastest fix: change `PORT` / `DATABASE_URL` / `REDIS_URL` in `crm-backend/.env` to a
  free port, and `VITE_API_BASE_URL` in `crm-frontend/.env` to match. The `.env` files
  shipped with this project are already set to `4001` / `6380` as a confirmed-working
  example — change them back to the defaults (`4000` / `6379`) if those ports are free
  on your machine.
- If using `docker compose` instead of running the apps directly on the host, both
  `crm-backend/docker/docker-compose.yml` and `crm-fullstack/docker-compose.yml` now
  support overriding host ports without editing the file, e.g.:
  ```bash
  BACKEND_HOST_PORT=4001 REDIS_HOST_PORT=6380 docker compose up -d
  ```
  (defaults remain `4000`/`5432`/`6379` if unset).

## 4. Frontend Setup

```bash
cd crm-frontend
cp .env.example .env         # set VITE_API_BASE_URL to your backend
npm install
npm run dev                  # http://localhost:3000
```

Frontend-only / no-backend demo mode: `cp .env.mock .env.local && npm run dev` (serves
from `src/lib/mockData.ts`).

## 5. Redis Setup

Redis is provisioned in `crm-fullstack/docker-compose.yml` (`redis:7-alpine`) and its URL
is read via `REDIS_URL`, but no backend module currently consumes it — there is no cache
or queue module wired to `@nestjs/cache-manager` / `bullmq` / `ioredis` in
`src/modules/**`. Either wire it up before relying on it, or drop the service from your
production topology to reduce moving parts. Don't assume caching or job queuing already
works because Redis is running.

## 6. PostgreSQL Setup

- Postgres 16+ recommended (matches `docker/docker-compose.yml`).
- Provide `DATABASE_URL` in the standard
  `postgresql://user:pass@host:5432/dbname?schema=public` form.
- All business tables use soft deletes (`deletedAt`); `PrismaService` installs Prisma
  middleware that auto-filters `deletedAt: null` on find queries for
  `User, Booking, Revenue, MCO, Chargeback, Refund, IPRule, Airline, BookingClass,
  Provider, CardProcessor, CallQueue` — deleting rows for real (`DELETE FROM ...`) will
  bypass application-level audit trails, so don't do it outside of a deliberate purge.

## 7. Prisma Setup

- Schema: `crm-backend/prisma/schema.prisma` (single file).
- Standard workflow: edit schema → `npx prisma migrate dev --name <change>` in dev,
  `npx prisma migrate deploy` in production (already wired as `npm run db:migrate:prod`).
- A **hand-written manual migration** already exists at
  `prisma/migrations/manual/001_airlines_notes_features.sql` — it documents exactly how
  the `airlines.name` column was renamed to `airline_name` (with backfill) and how
  `booking_notes` was added. This is directly relevant to §12 (migrating the client's
  existing production DB) if their current schema still has the old `name` column.

## 8. Environment Variables

**Backend (`crm-backend/.env`)** — see `.env.example` for the full list:

| Variable | Required in prod | Notes |
|---|---|---|
| `NODE_ENV` | yes | must be `production` to enable prod behaviors (see below) |
| `PORT` | no | default `4000` |
| `API_PREFIX` | no | default `api/v1` |
| `CORS_ORIGINS` | yes | comma-separated list of allowed origins |
| `DATABASE_URL` | yes | Postgres connection string |
| `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` | **yes** | ≥32 random chars each. **The app now refuses to boot in production without these set** (`src/config/jwt.config.ts`) — previously it silently fell back to a hardcoded dev secret, which was fixed during this pass because it's a real credential-leak risk if an env var was ever missed in a deploy. |
| `ACCESS_TOKEN_EXPIRY` / `REFRESH_TOKEN_EXPIRY` | no | default `15m` / `7d` |
| `REDIS_URL` | no | provisioned but unused — see §5 |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` / `THROTTLE_LOGIN_LIMIT` | no | global + login-specific rate limits |

**Frontend (`crm-frontend/.env`)**:

| Variable | Notes |
|---|---|
| `VITE_API_BASE_URL` | e.g. `https://api.yourdomain.com/api/v1` |
| `VITE_USE_MOCK` | `true` serves `mockData.ts` with no backend |

Generate strong secrets: `openssl rand -base64 48`.

## 9. Build Commands

```bash
# Backend
cd crm-backend && npm run build      # nest build → dist/

# Frontend
cd crm-frontend && npm run build     # tsc --noEmit && vite build → dist/
```

Both are now full type-checked builds (see §14 — the frontend previously had no
`typescript` dependency at all, so nothing ever actually type-checked it).

## 10. Production Build

```bash
NODE_ENV=production npm run build   # both apps
NODE_ENV=production npm run db:migrate:prod   # backend, against prod DATABASE_URL
```

## 11. Production Deployment

Two supported paths:

**A. Docker** (recommended, see §14 for the Dockerfile already provided):
```bash
cd crm-backend/docker
docker compose up -d --build
```
Serve the frontend's `dist/` as static files behind Nginx (below) — it isn't Dockerized
by default; `crm-fullstack/docker-compose.yml`'s `frontend` service is a **dev-only**
convenience (`npm install && vite preview`), not a production image. Build a proper
static Nginx image (`nginx:alpine` + `COPY dist/ /usr/share/nginx/html`) for prod.

**B. Bare metal / VM with PM2:**
```bash
cd crm-backend && npm ci --omit=dev && npx prisma generate && npm run build
pm2 start dist/main.js --name crm-backend -i max   # cluster mode across CPU cores
cd crm-frontend && npm ci && npm run build
# serve crm-frontend/dist/ via Nginx (below)
```

## 12. Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name crm.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/crm.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.yourdomain.com/privkey.pem;

    # Frontend static files
    root /var/www/crm-frontend/dist;
    location / {
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
server {
    listen 80;
    server_name crm.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

## 13. PM2 Configuration

`ecosystem.config.js` (place at `crm-backend/`):
```js
module.exports = {
  apps: [{
    name: "crm-backend",
    script: "dist/main.js",
    instances: "max",
    exec_mode: "cluster",
    env_production: { NODE_ENV: "production" },
    max_memory_restart: "500M",
  }],
}
```
`pm2 start ecosystem.config.js --env production`, then `pm2 save && pm2 startup` for
restart-on-reboot.

## 14. Docker Deployment

`crm-backend/docker/Dockerfile` (already present, multi-stage, verified to build) and
`crm-backend/docker/docker-compose.yml` (Postgres + Redis + backend, with health checks
gating backend startup on Postgres readiness) are ready to use as-is. Bugs fixed in this
pass that affect this build:
- `.gitignore` was missing entirely (backend and frontend) — added, so `node_modules`,
  `dist`, and `.env` no longer risk being committed.
- Frontend had no `typescript` dependency and no type-checking build step — added
  (`tsc --noEmit && vite build`), so a broken frontend build now fails loudly instead of
  shipping silently-broken JS (see §16, §9 real bugs this caught).

## 15. SSL

Use Let's Encrypt via `certbot --nginx -d crm.yourdomain.com`; renews automatically via
the certbot systemd timer. Force TLS 1.2+ only in the Nginx `ssl_protocols` directive.

## 16. Domain Configuration

Point an A/AAAA record at the server's IP; if backend and frontend are split across
hosts, use a CNAME for an `api.` subdomain and set `CORS_ORIGINS` /
`VITE_API_BASE_URL` accordingly.

## 17. Reverse Proxy

Covered by §12. If placing behind a CDN/WAF (Cloudflare, etc.), ensure WebSocket/SSE
aren't in play (this app is plain REST + polling via TanStack Query, so no special
proxy config needed beyond standard HTTP).

## 18. Firewall

Only expose 80/443 publicly. Postgres (5432) and Redis (6379) should be bound to
`127.0.0.1` or a private network only — the docker-compose files currently publish
`5432:5432` and `6379:6379` to the host, which is fine on an isolated VM but **must be
firewalled (ufw/security group) before this ever runs on a machine with a public IP**.

## 19. Backups

- `pg_dump` nightly, retained ≥30 days, stored off-host (S3 or equivalent).
  `pg_dump --format=custom $DATABASE_URL > backup-$(date +%F).dump`
- Test restores quarterly — an untested backup is not a backup.
- If using managed Postgres (RDS, Cloud SQL, etc.), enable automated snapshots +
  point-in-time recovery instead of rolling your own.

## 20. Monitoring

- `GET /api/v1/health` was added during this pass (previously there was no health
  endpoint at all) — returns `{ status, database, uptimeSec, timestamp, latencyMs }`
  and is `@Public()` (no auth required), suitable for a load balancer or uptime monitor.
- Wire it to your platform's health check (ALB target group, k8s liveness probe, Docker
  `HEALTHCHECK`, UptimeRobot, etc.).
- Application errors flow through `GlobalExceptionFilter` — pair with Sentry or similar
  by adding its Nest interceptor alongside the existing `ResponseInterceptor`.

## 21. Logging

`LoggerMiddleware` logs every request; Nest's default logger is used elsewhere
(`logger: ["log","warn","error","debug"]` in `main.ts`, trimmed to `["warn","error"]`
in `PrismaService`'s query logging when not `development`). For production, pipe stdout
to your platform's log aggregator (CloudWatch, Loki, etc.) — nothing further to wire up.

## 22. Production Checklist

- [ ] `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` set to strong, unique values (app
      now refuses to boot in `NODE_ENV=production` without them)
- [ ] `DATABASE_URL` points at production Postgres, not the dev container
- [ ] `CORS_ORIGINS` restricted to your real frontend origin(s), not `localhost`
- [ ] Postgres/Redis ports firewalled from public access
- [ ] `npm run db:migrate:prod` run against prod DB (not `migrate dev`)
- [ ] Prisma engine generated with real network access (not the no-op fallback)
- [ ] `npm run build` succeeds on both apps (both are now type-checked — verify in CI)
- [ ] `/api/v1/health` wired to your uptime/orchestration health check
- [ ] Backups scheduled and a restore has been tested at least once
- [ ] SSL certificate installed and auto-renewing

## 23. Security Checklist

- [ ] Secrets are ≥32 random chars, not reused across environments
- [ ] `.env` files are gitignored (fixed this pass) and never committed
- [ ] Rate limiting active (`ThrottlerGuard`, already global) — confirm
      `THROTTLE_LOGIN_LIMIT` is tight enough for your risk tolerance
- [ ] `IpGuard` / IP allow-deny rules reviewed for admin-only access if needed
- [ ] Helmet is active (`main.ts`) — confirm `crossOriginEmbedderPolicy: false` is
      still intentional for your asset-loading needs, not a leftover from debugging
- [ ] Dependency audit run (`npm audit`) before go-live and periodically after

## 24. Scaling Recommendations

- Backend is stateless (JWT-based auth, no in-memory session store) — safe to run
  multiple instances behind a load balancer or PM2 cluster mode.
- Add DB read replicas + route read-heavy endpoints (dashboards, search) to a replica
  connection if load grows; Prisma supports this via a second `DATABASE_URL` client.
- If Redis is wired up (§5), it's the natural place for response caching on the
  dashboard/search endpoints, which currently hit Postgres on every request.
- Watch the frontend bundle: the build currently emits one ~580KB (186KB gzipped) main
  chunk and a ~370KB chart vendor chunk — fine for an internal CRM's initial load, but
  worth route-based code-splitting (`React.lazy`) if the app grows further.

## 25. Disaster Recovery

- Restore latest `pg_dump` to a fresh Postgres instance, point a `DATABASE_URL` at it,
  run `npm run db:migrate:prod` to apply any migrations newer than the backup, redeploy
  backend/frontend pointing at the restored DB.
- Keep the manual migration SQL (`prisma/migrations/manual/`) and `prisma/schema.prisma`
  under version control together — schema drift between the two is the main DR risk for
  a Prisma app when migrations are ever applied by hand.

---

## Database Migration: bringing over the client's existing production data

This CRM is replacing an existing production CRM with real data. This section is the
concrete plan for that cutover.

### 26.1 Connect to the client's existing database

Get read access to their current production DB (a replica or point-in-time snapshot —
never write access to their live system during exploration). Confirm: DB engine/version,
approximate row counts per table, and whether it already uses the same conceptual model
(companies, bookings, revenue, users) or a different shape you'll need to transform.

### 26.2 Schema comparison and transform mapping

Build an explicit field-mapping table (old column → new column, old table → new table)
before writing any transform code. This project's own history is a live example of why
this matters: the `airlines` table was migrated from a `name` column to `airlineName`
(see `prisma/migrations/manual/001_airlines_notes_features.sql`), and a stale mapping
caused three separate runtime bugs that were only found and fixed during this review
(global search, the booking list/detail query, and several frontend display components
all still referenced the old field name months after the migration). **Any migration
plan must include an automated check — a script or test — that queries every selected
field against `prisma/schema.prisma` before go-live**, not just a one-time manual review,
so a renamed/dropped column can't silently reintroduce this class of bug.

### 26.3 ID preservation

Prefer preserving the client's existing primary keys (even if they're not UUIDs — Prisma
doesn't require UUIDs, `@id` just needs uniqueness) over regenerating new ones, *if*
those IDs are referenced anywhere outside the database (emails, printed documents,
support tickets the client's staff already reference by ID). Regenerating IDs is only
safe if you also migrate every external reference, which is usually the harder problem.
If old IDs aren't UUID-shaped and the schema requires UUIDs, generate deterministic
UUIDv5s from the old ID (namespace + old ID) so the mapping is reproducible and
auditable, rather than a throwaway random mapping table.

### 26.4 Master/reference data first

Migrate in dependency order: **Company → Currencies/Airlines/BookingClasses/Providers/
CardProcessors/CallQueues (master data) → Users → Bookings → Revenue/MCO/Chargebacks/
Refunds (which reference Bookings) → ActivityLog/Notifications (if historical audit
trail needs to carry over)**. The seed script (`prisma/seed/index.ts`) already
demonstrates the idempotent upsert pattern to follow for master data — reuse that
pattern (`findFirst` + create, or a natural-key `upsert`) so a re-run mid-migration
doesn't duplicate rows.

### 26.5 Users

Migrate user records without their old plaintext or old-algorithm password hashes if the
old system used a weaker scheme; instead, force a password reset flow on first login
post-cutover (generate a one-time reset token, email it), rather than trying to make an
incompatible hash format work with this app's `bcrypt`-based `hash.util.ts`. Preserve
email as the natural key for de-duplication.

### 26.6 Bookings and Revenue

These have a foreign-key dependency (Revenue/MCO/Chargeback/Refund → Booking), so
bookings must exist (with their final IDs) before revenue rows are inserted. Validate
financial totals against the old system's reports for a sample of bookings (and ideally
100% of bookings by count and by summed gross amount) before considering the migration
complete — a silent rounding or currency-mismatch bug in financial data is far worse than
one in a display label.

### 26.7 Downtime avoidance

1. Take a snapshot of the old DB, do a full trial migration into a staging copy of the
   new schema, and validate it (§26.8) — repeatable, no production impact.
2. Schedule a short maintenance window. Put the old system in read-only mode.
3. Run a final incremental migration for anything created since the snapshot.
4. Cut DNS/load balancer over to the new stack.
5. Keep the old system reachable (read-only) for a rollback window (recommend ≥2 weeks)
   in case data issues surface under real usage.

### 26.8 Validation

- Row counts match per table (old source vs. migrated) after accounting for any
  intentional filtering (e.g., excluding soft-deleted rows if the old system didn't have
  the concept).
- Spot-check a random sample (and 100% of high-value bookings) field-by-field.
- Sum financial fields (gross/net amounts) per currency and compare old vs. new totals.
- Run the app's own test suite plus a smoke test of login, booking search, and the
  revenue dashboard against the migrated data before opening it to real users.

### 26.9 Rollback

Because the old system stays read-only and reachable during the rollback window
(§26.7.5), rollback is: revert DNS/load balancer to the old system, investigate the
issue against the staging copy (not production), and re-attempt cutover once fixed.
Never delete the old production database until the rollback window has fully elapsed
and a backup of the new (migrated) database has also been taken.

### 26.10 Prisma schema changes during migration

If the migration reveals the schema needs to change (e.g., a field the old system has
that this schema doesn't), add it via a normal `prisma migrate dev` in a feature branch,
review the generated SQL migration by hand (Prisma's diff isn't always what you'd write
by hand for a data-carrying `ALTER TABLE`), and only then apply it to staging and
production in that order — never edit `schema.prisma` and expect `migrate deploy` to
retroactively fix data that's already been transformed incorrectly.
