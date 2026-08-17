import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { AppShell } from '@/components/app/AppShell'
import { Skeleton } from '@/components/ui/Skeleton'
import ManagePage from './ManagePage'

const LoginPage            = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage        = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const BookingsListPage     = lazy(() => import('@/features/bookings/pages/BookingsListPage'))
const BookingDetailPage    = lazy(() => import('@/features/bookings/pages/BookingDetailPage'))
const BookingFormPage      = lazy(() => import('@/features/bookings/pages/BookingFormPage'))
const FindBookingsPage     = lazy(() => import('@/features/bookings/pages/FindBookingsPage'))
const RevenueDetailsPage   = lazy(() => import('@/features/revenue/pages/RevenueDetailsPage'))
const ManageOverviewPage   = lazy(() => import('@/app/ManageOverviewPage'))
const UsersListPage        = lazy(() => import('@/features/users/pages/UsersListPage'))
const UserDetailPage       = lazy(() => import('@/features/users/pages/UserDetailPage'))
const CreateUserPage       = lazy(() => import('@/features/users/pages/CreateUserPage'))
const RevenueDashboard     = lazy(() => import('@/features/revenue/pages/RevenueDashboardPage'))
const IPRulesPage          = lazy(() => import('@/features/security/pages/IPRulesPage'))
const SecurityLogsPage     = lazy(() => import('@/features/security/pages/SecurityLogsPage'))
const ActivityPage         = lazy(() => import('@/features/activity/pages/ActivityPage'))
const ProfilePage          = lazy(() => import('@/features/settings/pages/ProfilePage'))
const AirlinesPage         = lazy(() => import('@/features/manage/airlines/pages/AirlinesPage'))
const VerifyBookingPage    = lazy(() => import('@/features/verification/pages/VerifyBookingPage'))

function PageLoader() {
  return (
    <div className="p-8 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <Skeleton className="h-64 w-full mt-6" />
    </div>
  )
}

function AuthGuard() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

function GuestGuard() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-6xl font-bold text-slate-300">404</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">Page not found</p>
      <a href="/dashboard" className="mt-4 text-sm text-blue-600 hover:underline">Back to Dashboard</a>
    </div>
  )
}

const router = createBrowserRouter([
  // Public — the client verifying a booking never logs into the CRM, so this
  // route sits outside both AuthGuard and GuestGuard entirely.
  { path: '/verify/:token', element: <Suspense fallback={<PageLoader />}><VerifyBookingPage /></Suspense> },
  { element: <GuestGuard />, children: [
    { path: '/login', element: <LoginPage /> },
  ]},
  { element: <AuthGuard />, children: [
    { path: '/',                      element: <Navigate to="/dashboard" replace /> },
    { path: '/dashboard',             element: <DashboardPage /> },
    { path: '/bookings',              element: <BookingsListPage /> },
    { path: '/bookings/find',         element: <FindBookingsPage /> },
    { path: '/bookings/new',          element: <BookingFormPage /> },
    { path: '/bookings/:id',          element: <BookingDetailPage /> },
    { path: '/bookings/:id/edit',     element: <BookingFormPage /> },
    { path: '/users',                 element: <UsersListPage /> },
    { path: '/users/:id',             element: <UserDetailPage /> },
    { path: '/users/new',             element: <CreateUserPage /> },
    { path: '/revenue',               element: <RevenueDashboard /> },
    { path: '/revenue/reports',       element: <RevenueDashboard /> },
    { path: '/revenue/details',       element: <RevenueDetailsPage /> },
    { path: '/revenue/mco',           element: <RevenueDashboard /> },
    { path: '/revenue/chargebacks',   element: <RevenueDashboard /> },
    { path: '/revenue/refunds',       element: <RevenueDashboard /> },
    { path: '/security/ip-rules',     element: <IPRulesPage /> },
    { path: '/security/logs',         element: <SecurityLogsPage /> },
    { path: '/security/sessions',     element: <SecurityLogsPage /> },
    { path: '/activity',              element: <ActivityPage /> },
    { path: '/manage',                element: <ManageOverviewPage /> },
    { path: '/manage/airlines',       element: <AirlinesPage /> },
    { path: '/manage/classes',        element: <ManagePage section="classes" /> },
    { path: '/manage/currencies',     element: <ManagePage section="currencies" /> },
    { path: '/manage/card-processors', element: <ManagePage section="card-processors" /> },
    { path: '/manage/providers',      element: <ManagePage section="providers" /> },
    { path: '/manage/call-queues',    element: <ManagePage section="call-queues" /> },
    { path: '/settings/profile',      element: <ProfilePage /> },
    { path: '/settings/notifications', element: <ProfilePage /> },
    { path: '/settings/company',      element: <ProfilePage /> },
    { path: '*',                      element: <NotFoundPage /> },
  ]},
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
