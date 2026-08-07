export interface Airline {
  id:          string
  companyId:   string | null
  airlineName: string
  iataCode:    string
  icaoCode:    string | null
  country:     string
  logoUrl:     string | null
  isActive:    boolean
  createdAt:   string
  updatedAt:   string
  deletedAt:   string | null
}

export interface BookingClass {
  id: string; companyId: string | null; name: string; code: string; isActive: boolean
}
export interface Provider {
  id: string; companyId: string | null; name: string; logoUrl: string | null; isActive: boolean
}
export interface CardProcessor {
  id: string; companyId: string | null; name: string; shortCode: string | null; isActive: boolean
}
export interface Currency {
  id: string; code: string; name: string; symbol: string; decimalPlaces: number; isActive: boolean
}
export interface CallQueue {
  id: string; companyId: string; name: string; phone: string | null; description: string | null; isActive: boolean
}
export interface Notification {
  id: string; companyId: string; userId: string; title: string; body: string
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  sourceType: string | null; sourceId: string | null
  actionUrl: string | null; readAt: string | null; dismissedAt: string | null; createdAt: string
}
export interface IPRule {
  id: string; companyId: string; type: 'ALLOW' | 'DENY'; cidr: string
  description: string | null; createdById: string; createdAt: string; updatedAt: string
}
export interface Session {
  id: string; userId: string; companyId: string; ipAddress: string
  userAgent: string | null; expiresAt: string; revokedAt: string | null; createdAt: string
}
export interface SavedView {
  id: string; tableKey: string; name: string; filters: Record<string, unknown>
  sortBy: string | null; sortDir: string | null; columns: string[] | null
  isDefault: boolean; createdAt: string
}
export type SelectOption<T = string> = { value: T; label: string; disabled?: boolean }
