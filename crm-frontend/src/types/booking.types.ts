import type { User } from './user.types'
export type BookingStatus = 'PENDING'|'CONFIRMED'|'TICKETED'|'CANCELLED'|'REFUNDED'|'CHARGEBACK'
export type BookingSearchField = 'reference'|'bidNumber'|'passengerName'|'customerEmail'|'pnr'
export type TransactionType =
  | 'NEW_BOOKING' | 'CANCEL_FOR_REFUND' | 'CANCEL_FOR_FUTURE_CREDIT' | 'EXCHANGE'
  | 'UPGRADE' | 'BAGGAGE_ADDON' | 'EXTRA_ADDON' | 'SEAT_ASSIGNMENT' | 'TICKET_REISSUANCE'
export type PassengerType = 'ADULT' | 'CHILD' | 'INFANT_ON_SEAT' | 'INFANT_ON_LAP'
export type ItineraryDirection = 'OUTBOUND' | 'RETURN'

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
export const PASSENGER_TYPE_LABELS: Record<PassengerType, string> = {
  ADULT: 'Adult', CHILD: 'Child', INFANT_ON_SEAT: 'Infant On Seat', INFANT_ON_LAP: 'Infant On Lap',
}

export interface BookingTransaction {
  id: string; transactionNumber: number; transactionType: TransactionType; status: string
}

export type BookingVerificationStatus = 'PENDING' | 'VERIFIED' | 'EXPIRED'

export interface BookingVerification {
  id: string; status: BookingVerificationStatus; clientEmail: string
  verifiedAt: string | null; expiresAt: string; createdAt: string
}

export interface Charge {
  id: string; chargeNumber: number; amount: number; currencyId: string; description: string | null
  currency?: { id: string; code: string; symbol: string; decimalPlaces: number }
}

export type ItineraryDataType = "TEXT" | "IMAGE"

export interface ItinerarySegment {
  id: string; direction: ItineraryDirection; segmentNumber: number
  itineraryType: ItineraryDataType
  airlineId: string | null
  flightNumber: string | null; fromText: string | null; toText: string | null
  departureAt: string | null; arrivalAt: string | null
  classId: string | null; pnrConfirmation: string | null
  imageUrls: string[]
  airline?: { id: string; airlineName: string; iataCode: string }
  class?: { id: string; name: string; code: string }
}

export interface Passenger {
  id: string; passengerNumber: number; type: PassengerType
  firstName: string; middleName: string | null; lastName: string
  dob: string | null; ticketNumber: string | null
}

export interface BillingDetail {
  id: string; cardHolderName: string; cardLast4: string; expiryMonth: number; expiryYear: number
  billingEmail: string; billingContactNo: string
  billingStreet: string | null; billingCity: string | null; billingState: string | null
  billingZip: string | null; billingCountry: string | null; purchaseDate: string
  cardProcessor?: { id: string; name: string }
}

export interface Attachment {
  id: string; fileUrl: string; fileName: string; createdAt: string
}

export interface Booking {
  id: string; companyId: string; bidNumber: number; reference: string; pnr: string | null;
  customerEmail: string; status: BookingStatus;
  providerId: string; callQueueId: string|null; assignedToId: string|null; createdById: string;
  isUrgent?: boolean; createdAt: string; updatedAt: string; version: number;
  provider?: { id: string; name: string };
  assignedTo?: User|null; createdBy?: User;
  passengers?: Passenger[]
  segments?: ItinerarySegment[]
  charges?: Charge[]
  billing?: BillingDetail | null
  attachments?: Attachment[]
  // Latest transaction (today, always Transaction #1) — see IMPLEMENTATION.md
  // "Booking transaction architecture" for why this is an array of at most one.
  transactions?: BookingTransaction[]
  // Latest client authorization request, if any has ever been sent — same
  // "array of at most one, take latest" convention as `transactions`.
  verifications?: BookingVerification[]
}

export interface BookingFilters {
  status?: BookingStatus; provider_id?: string; assigned_to_id?: string;
  date_from?: string; date_to?: string; search?: string;
  search_field?: BookingSearchField; is_urgent?: boolean
}

// ── Create Booking wizard input shapes — mirror the backend DTOs exactly ──
export interface ChargeInput { chargeNumber: number; amount: number; currencyId: string; description?: string }
export interface ItinerarySegmentInput {
  direction?: ItineraryDirection; segmentNumber: number
  itineraryType?: ItineraryDataType
  // Text Data mode fields (unused/omitted for Image Data mode)
  airlineId?: string; flightNumber?: string
  fromText?: string; toText?: string; classId?: string
  // Shared: required for Text Data, optional for Image Data
  departureAt?: string; arrivalAt?: string
  pnrConfirmation?: string
  // Image Data mode field (at least one required when itineraryType is IMAGE)
  imageUrls?: string[]
}
export interface PassengerInput {
  passengerNumber: number; type: PassengerType; firstName: string; middleName?: string; lastName: string
  dob?: string; ticketNumber?: string
}
export interface BillingInput {
  cardHolderName: string; cardProcessorId: string; cardLast4: string
  expiryMonth: number; expiryYear: number; billingEmail: string; billingContactNo: string
  billingStreet?: string; billingCity?: string; billingState?: string; billingZip?: string; billingCountry?: string
  purchaseDate?: string
}
export interface AttachmentInput { fileUrl: string; fileName: string }

export interface CreateBookingInput {
  providerId: string; callQueueId?: string; customerEmail: string; pnr?: string
  status?: BookingStatus; assignedToId?: string; isUrgent?: boolean; transactionType?: TransactionType
  charges: ChargeInput[]; segments: ItinerarySegmentInput[]; passengers: PassengerInput[]
  billing: BillingInput; attachments?: AttachmentInput[]; specialDetails?: Record<string, unknown>
}
