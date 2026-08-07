# BookingCRM — Frontend

## Quick Start (Local Dev Server)

```bash
cd crm-frontend
npm run dev
```

Open **http://localhost:3000**

## Demo Login
- **Email:** admin@demo.com
- **Password:** password

## Build for Production
```bash
npm run build
npm run preview   # preview the production build locally
```

## Stack
- React 19 + TypeScript + Vite
- Tailwind CSS (design tokens in tailwind.config.js)
- TanStack Table v8 (server-side pagination/sort/filter)
- TanStack Query v5
- React Hook Form + Zod
- Recharts
- Radix UI primitives
- Lucide icons
- Sonner toasts

## Pages Available
| Route | Description |
|---|---|
| /dashboard | KPI metrics, revenue chart, recent bookings |
| /bookings | Full table with search, filter, sort, pagination |
| /bookings/new | Create booking form |
| /bookings/:id | Booking detail with activity timeline |
| /bookings/:id/edit | Edit booking |
| /users | User list |
| /revenue | Revenue dashboard with charts |
| /security/ip-rules | IP allow/deny rules |
| /security/logs | Security event log |
| /activity | Global audit trail |
| /manage/airlines | Reference data (airlines, classes, currencies, etc.) |
| /settings/profile | User profile |

## Architecture Notes
- All data is **mock** (src/lib/mockData.ts) — no backend required
- Auth is demo-only (sessionStorage flag) — swap AuthProvider for real JWT flow
- API client (src/lib/api-client.ts) is pre-wired for a real backend at /api/v1
- Column visibility persists to localStorage per table
- Sidebar collapse state persists to localStorage
