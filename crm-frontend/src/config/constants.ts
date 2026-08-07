export const APP_NAME = 'BookingCRM'

export const PAGINATION_DEFAULTS = {
  page: 1, per_page: 25,
  per_page_options: [10, 25, 50, 100],
} as const

export const SIDEBAR_STORAGE_KEY = 'crm_sidebar_collapsed'
export const COLUMN_VISIBILITY_PREFIX = 'crm_col_vis_'
export const DEBOUNCE_SEARCH_MS = 300

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending', CONFIRMED: 'Confirmed', TICKETED: 'Ticketed',
  CANCELLED: 'Cancelled', REFUNDED: 'Refunded', CHARGEBACK: 'Chargeback',
}
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: 'warning', CONFIRMED: 'info', TICKETED: 'success',
  CANCELLED: 'default', REFUNDED: 'default', CHARGEBACK: 'error',
}
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', MANAGER: 'Manager', OPERATOR: 'Operator',
}
export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Created', UPDATE: 'Updated', DELETE: 'Deleted', VIEW: 'Viewed',
  EXPORT: 'Exported', LOGIN: 'Logged in', LOGOUT: 'Logged out',
  FAILED_LOGIN: 'Failed login', PASSWORD_RESET: 'Reset password',
}

export const QUERY_STALE_TIMES = {
  reference: 5 * 60 * 1000,
  list: 0,
  detail: 30 * 1000,
  dashboard: 60 * 1000,
  currentUser: 5 * 60 * 1000,
} as const

export const NOTIFICATION_POLL_MS = 30_000
export const DASHBOARD_POLL_MS = 60_000
