export const bookingKeys = {
  all: () => ['bookings'] as const,
  list: (p: unknown) => ['bookings','list',p] as const,
  detail: (id: string) => ['bookings','detail',id] as const,
}
export const userKeys = {
  all: () => ['users'] as const,
  list: (p: unknown) => ['users','list',p] as const,
  detail: (id: string) => ['users','detail',id] as const,
}
export const authKeys = { currentUser: () => ['auth','me'] as const }
export const dashboardKeys = { metrics: (p?: unknown) => ['dashboard','metrics', p] as const }

export const QUERY_STALE_TIMES_REF = 5 * 60 * 1000

export const revenueKeys = {
  all:         ()              => ['revenue'] as const,
  list:        (p: unknown)    => ['revenue', 'list', p] as const,
  detail:      (id: string)    => ['revenue', 'detail', id] as const,
  dashboard:   (p: unknown)    => ['revenue', 'dashboard', p] as const,
  detailsList: (p: unknown)    => ['revenue', 'details-list', p] as const,
  mcos:        (p: unknown)    => ['revenue', 'mcos', p] as const,
  chargebacks: (p: unknown)    => ['revenue', 'chargebacks', p] as const,
  refunds:     (p: unknown)    => ['revenue', 'refunds', p] as const,
}

export const securityKeys = {
  ipRules:  (p: unknown) => ['security', 'ip-rules', p] as const,
  logs:     (p: unknown) => ['security', 'logs', p] as const,
  sessions: (p: unknown) => ['security', 'sessions', p] as const,
}

export const activityKeys = {
  list: (p: unknown) => ['activity', 'list', p] as const,
  me:   (p: unknown) => ['activity', 'me', p] as const,
}

export const notificationKeys = {
  list:        (p: unknown) => ['notifications', 'list', p] as const,
  unreadCount: ()           => ['notifications', 'unread-count'] as const,
}

export const referenceKeys = {
  airlines:       (p?: unknown) => ['reference', 'airlines', p] as const,
  classes:        (p?: unknown) => ['reference', 'classes', p] as const,
  currencies:     (p?: unknown) => ['reference', 'currencies', p] as const,
  cardProcessors: (p?: unknown) => ['reference', 'card-processors', p] as const,
  providers:      (p?: unknown) => ['reference', 'providers', p] as const,
  callQueues:     (p?: unknown) => ['reference', 'call-queues', p] as const,
}
