import type { User } from './user.types'
export type BookingStatus = 'PENDING'|'CONFIRMED'|'TICKETED'|'CANCELLED'|'REFUNDED'|'CHARGEBACK'
export type BookingSearchField = 'reference'|'passengerName'|'passengerEmail'|'passengerPhone'|'pnr'
export type TransactionType =
  | 'NEW_BOOKING' | 'CANCEL_FOR_REFUND' | 'CANCEL_FOR_FUTURE_CREDIT' | 'EXCHANGE'
  | 'UPGRADE' | 'BAGGAGE_ADDON' | 'EXTRA_ADDON' | 'SEAT_ASSIGNMENT' | 'TICKET_REISSUANCE'

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  NEW_BOOKING: 'New Booking',
  CANCEL_FOR_REFUND: 'Cancel for Refund',
  CANCEL_FOR_FUTURE_CREDIT: 'Cancel for Future Credit',
  EXCHANGE: 'Exchange',
  UPGRADE: 'Upgrade',
  BAGGAGE_ADDON: 'Baggage Add-On',
  EXTRA_ADDON: 'Extra Add-On',
  SEAT_ASSIGNMENT: 'Seat Assignment',
  TICKET_REISSUANCE: 'Ticket Reissuance',
}
export const TRANSACTION_TYPE_DESCRIPTIONS: Record<TransactionType, string> = {
  NEW_BOOKING: 'Create a new flight booking reservation',
  CANCEL_FOR_REFUND: 'Cancel booking and process refund',
  CANCEL_FOR_FUTURE_CREDIT: 'Cancel booking and issue future credit',
  EXCHANGE: 'Exchange existing booking for new dates/flights',
  UPGRADE: 'Upgrade flight class or service level',
  BAGGAGE_ADDON: 'Add extra baggage allowance to booking',
  EXTRA_ADDON: 'Add extra services to existing booking',
  SEAT_ASSIGNMENT: 'Assign or change seat selection',
  TICKET_REISSUANCE: 'Reissue ticket with updated information',
}

export interface BookingTransaction {
  id: string; transactionNumber: number; transactionType: TransactionType; status: string
}

export interface Booking {
  id: string; companyId: string; reference: string; pnr: string; passengerName: string;
  passengerEmail: string|null; passengerPhone: string|null; status: BookingStatus;
  airlineId: string; classId: string; providerId: string; cardProcessorId: string;
  currencyId: string; callQueueId: string|null; assignedToId: string|null; createdById: string;
  grossAmount: number; netAmount: number; travelDate: string; returnDate: string|null;
  notes: string|null; isUrgent?: boolean; createdAt: string; updatedAt: string;
  airline?: { id: string; airlineName: string; iataCode: string };
  class?: { id: string; name: string; code: string };
  provider?: { id: string; name: string };
  cardProcessor?: { id: string; name: string };
  currency?: { id: string; code: string; symbol: string; decimalPlaces: number };
  assignedTo?: User|null; createdBy?: User;
  // Latest transaction (today, always Transaction #1) — see IMPLEMENTATION.md
  // "Booking transaction architecture" for why this is an array of at most one.
  transactions?: BookingTransaction[]
}
export interface BookingFilters {
  status?: BookingStatus; airline_id?: string; provider_id?: string;
  card_processor_id?: string; assigned_to_id?: string; date_from?: string; date_to?: string; search?: string;
  search_field?: 'reference'|'passengerName'|'passengerEmail'|'passengerPhone'|'pnr'; is_urgent?: boolean
}
