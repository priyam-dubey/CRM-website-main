import type { Booking } from '@/types/booking.types'
import type { User } from '@/types/user.types'
import type { Revenue, Chargeback, Refund } from '@/types/revenue.types'
import type { ActivityLog, SecurityLog } from '@/types/activity.types'
import type { Airline, BookingClass, Provider, CardProcessor, Currency, CallQueue, IPRule } from '@/types/shared.types'

const MOCK_AIRLINE_DEFAULTS = {
  icaoCode: null, country: 'AE', logoUrl: null,
  createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z', deletedAt: null,
}
export const MOCK_AIRLINES: Airline[] = [
  { id: 'al-1', companyId: null, airlineName: 'Emirates', iataCode: 'EK', isActive: true, ...MOCK_AIRLINE_DEFAULTS },
  { id: 'al-2', companyId: null, airlineName: 'Qatar Airways', iataCode: 'QR', isActive: true, ...MOCK_AIRLINE_DEFAULTS },
  { id: 'al-3', companyId: null, airlineName: 'Lufthansa', iataCode: 'LH', isActive: true, ...MOCK_AIRLINE_DEFAULTS },
  { id: 'al-4', companyId: null, airlineName: 'British Airways', iataCode: 'BA', isActive: true, ...MOCK_AIRLINE_DEFAULTS },
  { id: 'al-5', companyId: null, airlineName: 'Air India', iataCode: 'AI', isActive: true, ...MOCK_AIRLINE_DEFAULTS },
  { id: 'al-6', companyId: null, airlineName: 'Singapore Airlines', iataCode: 'SQ', isActive: false, ...MOCK_AIRLINE_DEFAULTS },
]

export const MOCK_CLASSES: BookingClass[] = [
  { id: 'cl-1', companyId: null, name: 'Economy', code: 'Y', isActive: true },
  { id: 'cl-2', companyId: null, name: 'Premium Economy', code: 'W', isActive: true },
  { id: 'cl-3', companyId: null, name: 'Business', code: 'J', isActive: true },
  { id: 'cl-4', companyId: null, name: 'First Class', code: 'F', isActive: true },
]

export const MOCK_CURRENCIES: Currency[] = [
  { id: 'cu-1', code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isActive: true },
  { id: 'cu-2', code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isActive: true },
  { id: 'cu-3', code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isActive: true },
  { id: 'cu-4', code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, isActive: true },
]

export const MOCK_PROVIDERS: Provider[] = [
  { id: 'pr-1', companyId: null, name: 'Amadeus', logoUrl: null, isActive: true },
  { id: 'pr-2', companyId: null, name: 'Sabre', logoUrl: null, isActive: true },
  { id: 'pr-3', companyId: null, name: 'Galileo', logoUrl: null, isActive: true },
]

export const MOCK_CARD_PROCESSORS: CardProcessor[] = [
  { id: 'cp-1', companyId: null, name: 'Visa', shortCode: 'VI', isActive: true },
  { id: 'cp-2', companyId: null, name: 'Mastercard', shortCode: 'CA', isActive: true },
  { id: 'cp-3', companyId: null, name: 'American Express', shortCode: 'AX', isActive: false },
]

export const MOCK_CALL_QUEUES: CallQueue[] = [
  { id: 'cq-1', companyId: 'company-1', name: 'General Enquiries', phone: '9878967879', description: 'Default queue', isActive: true },
  { id: 'cq-2', companyId: 'company-1', name: 'VIP Clients', phone: '9878967323', description: 'Priority handling', isActive: true },
  { id: 'cq-3', companyId: 'company-1', name: 'Refunds', phone: null, description: 'Refund requests', isActive: true },
]

export const MOCK_IP_RULES: IPRule[] = [
  { id: 'ip-1', companyId: 'company-1', type: 'ALLOW', cidr: '192.168.1.0/24', description: 'Office network', createdById: 'user-1', createdAt: '2025-01-10T09:00:00Z', updatedAt: '2025-01-10T09:00:00Z' },
  { id: 'ip-2', companyId: 'company-1', type: 'DENY',  cidr: '10.0.0.0/8',     description: 'Blocked range',  createdById: 'user-1', createdAt: '2025-02-01T11:00:00Z', updatedAt: '2025-02-01T11:00:00Z' },
  { id: 'ip-3', companyId: 'company-1', type: 'ALLOW', cidr: '203.0.113.5/32', description: 'Remote dev',     createdById: 'user-1', createdAt: '2025-03-15T08:00:00Z', updatedAt: '2025-03-15T08:00:00Z' },
]

export const MOCK_USERS: User[] = [
  { id: 'user-1', companyId: 'company-1', email: 'admin@demo.com',   firstName: 'Alex',    lastName: 'Morgan',  role: 'ADMIN',    isActive: true,  lastLoginAt: '2025-07-26T08:00:00Z', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-07-26T08:00:00Z' },
  { id: 'user-2', companyId: 'company-1', email: 'sarah@demo.com',   firstName: 'Sarah',   lastName: 'Chen',    role: 'MANAGER',  isActive: true,  lastLoginAt: '2025-07-25T14:30:00Z', createdAt: '2024-02-15T00:00:00Z', updatedAt: '2025-07-25T14:30:00Z' },
  { id: 'user-3', companyId: 'company-1', email: 'james@demo.com',   firstName: 'James',   lastName: 'Wilson',  role: 'OPERATOR', isActive: true,  lastLoginAt: '2025-07-26T07:45:00Z', createdAt: '2024-03-10T00:00:00Z', updatedAt: '2025-07-26T07:45:00Z' },
  { id: 'user-4', companyId: 'company-1', email: 'priya@demo.com',   firstName: 'Priya',   lastName: 'Patel',   role: 'OPERATOR', isActive: true,  lastLoginAt: '2025-07-24T16:00:00Z', createdAt: '2024-04-05T00:00:00Z', updatedAt: '2025-07-24T16:00:00Z' },
  { id: 'user-5', companyId: 'company-1', email: 'carlos@demo.com',  firstName: 'Carlos',  lastName: 'Rivera',  role: 'OPERATOR', isActive: false, lastLoginAt: '2025-06-01T10:00:00Z', createdAt: '2024-05-20T00:00:00Z', updatedAt: '2025-06-01T10:00:00Z' },
  { id: 'user-6', companyId: 'company-1', email: 'linda@demo.com',   firstName: 'Linda',   lastName: 'Nguyen',  role: 'MANAGER',  isActive: true,  lastLoginAt: '2025-07-25T09:15:00Z', createdAt: '2024-06-01T00:00:00Z', updatedAt: '2025-07-25T09:15:00Z' },
]

const PASSENGER_NAMES = ['Mohammed Al-Rashid','Priya Sharma','James OBrien','Mei Lin Zhang','Carlos Eduardo Santos','Fatima Al-Hassan','David Kowalski','Amara Osei','Elena Petrov','Raj Krishnamurthy','Sophie Dubois','Ahmed Ben Ali','Yuki Tanaka','Isabella Rossi','Omar Shaikh']
const STATUSES: Booking['status'][] = ['PENDING','CONFIRMED','TICKETED','CANCELLED','REFUNDED','CHARGEBACK']
const STATUS_WEIGHTS = [0.1, 0.15, 0.55, 0.1, 0.07, 0.03]

function weightedStatus(): Booking['status'] {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < STATUS_WEIGHTS.length; i++) {
    acc += STATUS_WEIGHTS[i]
    if (r < acc) return STATUSES[i]
  }
  return 'CONFIRMED'
}

function rDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

export const MOCK_BOOKINGS: Booking[] = Array.from({ length: 80 }, (_, i) => {
  const id = `bk-${i + 1}`
  const status = weightedStatus()
  const grossAmount = (Math.floor(Math.random() * 200) + 50) * 10000
  const airline = MOCK_AIRLINES[i % MOCK_AIRLINES.length]
  const cls = MOCK_CLASSES[i % 4]
  const prov = MOCK_PROVIDERS[i % 3]
  const proc = MOCK_CARD_PROCESSORS[i % 2]
  const cur = MOCK_CURRENCIES[i % 4]
  const user = MOCK_USERS[i % 4]
  const travelDaysFromNow = Math.floor(Math.random() * 180) - 30
  const travel = new Date(); travel.setDate(travel.getDate() + travelDaysFromNow)
  return {
    id, companyId: 'company-1',
    reference: `BK-2025-${String(i + 1001).padStart(5,'0')}`,
    pnr: `PNR${Math.random().toString(36).substring(2,8).toUpperCase()}`,
    passengerName: PASSENGER_NAMES[i % PASSENGER_NAMES.length],
    passengerEmail: `pax${i}@email.com`,
    passengerPhone: `+1555${String(Math.floor(Math.random()*9000000)+1000000)}`,
    status, airlineId: airline.id, classId: cls.id, providerId: prov.id,
    cardProcessorId: proc.id, currencyId: cur.id,
    callQueueId: i % 5 === 0 ? 'cq-1' : null,
    assignedToId: user.id, createdById: 'user-1',
    grossAmount, netAmount: Math.floor(grossAmount * 0.85),
    travelDate: travel.toISOString(),
    returnDate: i % 3 !== 0 ? new Date(travel.getTime() + 7*86400000).toISOString() : null,
    notes: i % 7 === 0 ? 'Passenger requested window seat' : null,
    createdAt: rDate(Math.floor(Math.random() * 90)),
    updatedAt: rDate(Math.floor(Math.random() * 10)),
    airline, class: cls, provider: prov, cardProcessor: proc, currency: cur,
    createdBy: MOCK_USERS[0], assignedTo: user,
  }
})

export const MOCK_REVENUE: Revenue[] = MOCK_BOOKINGS.slice(0, 40).map((b, i) => ({
  id: `rev-${i+1}`, companyId: 'company-1', bookingId: b.id,
  currencyId: b.currencyId, type: 'FARE' as const,
  grossAmount: b.grossAmount, netAmount: b.netAmount,
  description: `Fare revenue for ${b.reference}`,
  entryDate: b.createdAt, createdById: 'user-1',
  createdAt: b.createdAt, updatedAt: b.updatedAt,
  currency: b.currency,
}))

export const MOCK_CHARGEBACKS: Chargeback[] = [
  { id:'cb-1', companyId:'company-1', bookingId:'bk-5', cardProcessorId:'cp-1', amount:125000, currencyId:'cu-1', status:'OPEN', reason:'Customer dispute', filedAt: rDate(5), resolvedAt:null, createdById:'user-2', createdAt:rDate(5), updatedAt:rDate(5) },
  { id:'cb-2', companyId:'company-1', bookingId:'bk-12', cardProcessorId:'cp-2', amount:89000, currencyId:'cu-1', status:'WON', reason:'Fraud claim', filedAt:rDate(30), resolvedAt:rDate(10), createdById:'user-2', createdAt:rDate(30), updatedAt:rDate(10) },
  { id:'cb-3', companyId:'company-1', bookingId:'bk-20', cardProcessorId:'cp-1', amount:210000, currencyId:'cu-2', status:'UNDER_REVIEW', reason:'Service not received', filedAt:rDate(15), resolvedAt:null, createdById:'user-1', createdAt:rDate(15), updatedAt:rDate(3) },
]

export const MOCK_REFUNDS: Refund[] = [
  { id:'rf-1', companyId:'company-1', bookingId:'bk-8', amount:75000, currencyId:'cu-1', status:'PROCESSED', reason:'Flight cancelled', requestedAt:rDate(20), processedAt:rDate(15), createdById:'user-3', createdAt:rDate(20), updatedAt:rDate(15) },
  { id:'rf-2', companyId:'company-1', bookingId:'bk-15', amount:150000, currencyId:'cu-2', status:'PENDING', reason:'Schedule change', requestedAt:rDate(3), processedAt:null, createdById:'user-4', createdAt:rDate(3), updatedAt:rDate(3) },
  { id:'rf-3', companyId:'company-1', bookingId:'bk-22', amount:50000, currencyId:'cu-1', status:'APPROVED', reason:'Medical emergency', requestedAt:rDate(7), processedAt:null, createdById:'user-3', createdAt:rDate(7), updatedAt:rDate(2) },
]

const ACTION_TYPES: ActivityLog['action'][] = ['CREATE','UPDATE','DELETE','VIEW','EXPORT','LOGIN']
export const MOCK_ACTIVITY: ActivityLog[] = Array.from({ length: 50 }, (_, i) => ({
  id: `act-${i+1}`, companyId: 'company-1',
  actorId: MOCK_USERS[i % 4].id,
  actorName: MOCK_USERS[i % 4].firstName + ' ' + MOCK_USERS[i % 4].lastName,
  action: ACTION_TYPES[i % ACTION_TYPES.length],
  entityType: ['Booking','User','Revenue','IPRule'][i % 4],
  entityId: `entity-${i+1}`,
  entityLabel: `BK-2025-${1001 + i}`,
  beforeSnapshot: null, afterSnapshot: null,
  ipAddress: `192.168.1.${(i % 50) + 10}`,
  userAgent: 'Mozilla/5.0',
  createdAt: rDate(Math.floor(Math.random() * 30)),
}))

export const MOCK_SECURITY_LOGS: SecurityLog[] = [
  { id:'sl-1', companyId:'company-1', userId:'user-1', event:'LOGIN', ipAddress:'192.168.1.10', userAgent:'Mozilla/5.0', metadata:null, createdAt: rDate(0) },
  { id:'sl-2', companyId:'company-1', userId:null,     event:'FAILED_LOGIN', ipAddress:'10.0.0.5', userAgent:'curl/7.0', metadata:{email:'hacker@evil.com'}, createdAt: rDate(1) },
  { id:'sl-3', companyId:'company-1', userId:'user-2', event:'LOGIN', ipAddress:'192.168.1.20', userAgent:'Chrome/125', metadata:null, createdAt: rDate(1) },
  { id:'sl-4', companyId:'company-1', userId:'user-1', event:'IP_BLOCKED', ipAddress:'10.0.0.5', userAgent:null, metadata:{rule:'ip-2'}, createdAt: rDate(2) },
  { id:'sl-5', companyId:'company-1', userId:'user-3', event:'LOGOUT', ipAddress:'192.168.1.30', userAgent:'Firefox/120', metadata:null, createdAt: rDate(2) },
]

export const REVENUE_CHART_DATA = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().split('T')[0],
    gross: Math.floor(Math.random() * 500000 + 200000),
    net: Math.floor(Math.random() * 400000 + 150000),
    chargebacks: Math.floor(Math.random() * 30000),
  }
})
