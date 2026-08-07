export const EVENTS = {
  BOOKING_CREATED:      'booking.created',
  BOOKING_UPDATED:      'booking.updated',
  BOOKING_CANCELLED:    'booking.cancelled',
  BOOKING_DELETED:      'booking.deleted',
  CHARGEBACK_FILED:     'revenue.chargeback.filed',
  REFUND_APPROVED:      'revenue.refund.approved',
  REFUND_REJECTED:      'revenue.refund.rejected',
  USER_CREATED:         'user.created',
  USER_DEACTIVATED:     'user.deactivated',
  SECURITY_IP_BLOCKED:  'security.ip.blocked',
  SECURITY_FAILED_LOGIN:'security.login.failed',
  REPORT_COMPLETED:     'report.completed',
} as const

export type EventName = (typeof EVENTS)[keyof typeof EVENTS]
