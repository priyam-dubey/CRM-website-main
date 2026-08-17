/**
 * Prisma type shims — allows TypeScript compilation without a generated Prisma client.
 * When Prisma generate runs in a live environment these are superseded by the real client.
 */

// Enums (must match prisma/schema.prisma exactly)
export enum UserRole         { ADMIN = 'ADMIN', MANAGER = 'MANAGER', OPERATOR = 'OPERATOR' }
export enum BookingStatus    { PENDING = 'PENDING', CONFIRMED = 'CONFIRMED', TICKETED = 'TICKETED', CANCELLED = 'CANCELLED', REFUNDED = 'REFUNDED', CHARGEBACK = 'CHARGEBACK' }
export enum RevenueType      { FARE = 'FARE', TAX = 'TAX', FEE = 'FEE', MCO = 'MCO', CHARGEBACK = 'CHARGEBACK', REFUND = 'REFUND', ADJUSTMENT = 'ADJUSTMENT' }
export enum ChargebackStatus { OPEN = 'OPEN', UNDER_REVIEW = 'UNDER_REVIEW', WON = 'WON', LOST = 'LOST' }
export enum RefundStatus     { PENDING = 'PENDING', APPROVED = 'APPROVED', REJECTED = 'REJECTED', PROCESSED = 'PROCESSED' }
export enum ActivityAction   { CREATE = 'CREATE', UPDATE = 'UPDATE', DELETE = 'DELETE', VIEW = 'VIEW', EXPORT = 'EXPORT', LOGIN = 'LOGIN', LOGOUT = 'LOGOUT', FAILED_LOGIN = 'FAILED_LOGIN', PASSWORD_RESET = 'PASSWORD_RESET' }
export enum SecurityEvent    { LOGIN = 'LOGIN', LOGOUT = 'LOGOUT', FAILED_LOGIN = 'FAILED_LOGIN', IP_BLOCKED = 'IP_BLOCKED', SESSION_REVOKED = 'SESSION_REVOKED', PASSWORD_CHANGED = 'PASSWORD_CHANGED' }
export enum NotificationSeverity { INFO = 'INFO', SUCCESS = 'SUCCESS', WARNING = 'WARNING', ERROR = 'ERROR' }
export enum IPRuleType       { ALLOW = 'ALLOW', DENY = 'DENY' }
export enum TransactionType  { NEW_BOOKING = 'NEW_BOOKING', CANCEL_FOR_REFUND = 'CANCEL_FOR_REFUND', CANCEL_FOR_FUTURE_CREDIT = 'CANCEL_FOR_FUTURE_CREDIT', EXCHANGE = 'EXCHANGE', UPGRADE = 'UPGRADE', BAGGAGE_ADDON = 'BAGGAGE_ADDON', EXTRA_ADDON = 'EXTRA_ADDON', SEAT_ASSIGNMENT = 'SEAT_ASSIGNMENT', TICKET_REISSUANCE = 'TICKET_REISSUANCE' }
export enum TransactionStatus { DRAFT = 'DRAFT', IN_PROGRESS = 'IN_PROGRESS', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }
export enum PassengerType     { ADULT = 'ADULT', CHILD = 'CHILD', INFANT_ON_SEAT = 'INFANT_ON_SEAT', INFANT_ON_LAP = 'INFANT_ON_LAP' }
export enum ItineraryDirection { OUTBOUND = 'OUTBOUND', RETURN = 'RETURN' }

// Minimal Prisma namespace shim for where/orderBy/create/update input types
export namespace Prisma {
  export type InputJsonValue = Record<string, unknown> | unknown[] | string | number | boolean | null
  export type UserWhereInput                  = Record<string, unknown>
  export type UserOrderByWithRelationInput    = Record<string, unknown>
  export type UserCreateInput                 = Record<string, unknown>
  export type UserUpdateInput                 = Record<string, unknown>
  export type BookingWhereInput               = Record<string, unknown>
  export type BookingOrderByWithRelationInput = Record<string, unknown>
  export type BookingCreateInput              = Record<string, unknown>
  export type BookingUpdateInput              = Record<string, unknown>
  export type RevenueWhereInput               = Record<string, unknown>
  export type RevenueOrderByWithRelationInput = Record<string, unknown>
  export type SecurityLogWhereInput           = Record<string, unknown>
  export type SessionWhereInput               = Record<string, unknown>
  export type ActivityLogWhereInput           = Record<string, unknown>
  export type BookingNoteWhereInput           = Record<string, unknown>
  export type NotificationWhereInput          = Record<string, unknown>
}

// Model types
export interface User {
  id: string; companyId: string; email: string; passwordHash: string
  firstName: string; lastName: string; role: UserRole; isActive: boolean
  lastLoginAt: Date | null; version: number; createdAt: Date; updatedAt: Date; deletedAt: Date | null
}
export interface Notification {
  id: string; companyId: string; userId: string; title: string; body: string
  severity: NotificationSeverity; sourceType: string | null; sourceId: string | null
  actionUrl: string | null; readAt: Date | null; dismissedAt: Date | null; createdAt: Date
}

export interface Airline {
  id: string
  companyId: string | null
  airlineName: string
  iataCode: string
  icaoCode: string | null
  country: string
  logoUrl: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface BookingNote {
  id: string
  bookingId: string
  userId: string
  note: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
  user?: {
    id: string
    firstName: string
    lastName: string
    role: string
  }
}
