import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, parseISO, differenceInCalendarDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatCurrency(cents: number, currencyCode = 'USD', decimalPlaces = 2): string {
  const amount = cents / Math.pow(10, decimalPlaces)
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode,
    minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(amount)
}

export function formatCurrencyCompact(cents: number, currencyCode = 'USD'): string {
  const amount = cents / 100
  if (Math.abs(amount) >= 1_000_000) return currencyCode + ' ' + (amount / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(amount) >= 1_000) return currencyCode + ' ' + (amount / 1_000).toFixed(1) + 'K'
  return formatCurrency(cents, currencyCode)
}

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "—"
  return format(typeof date === 'string' ? parseISO(date) : date, 'MMM d, yyyy HH:mm')
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(typeof date === 'string' ? parseISO(date) : date, { addSuffix: true })
}

// Urgent Bookings label: how soon the travel date is, by CALENDAR day —
// differenceInCalendarDays ignores time-of-day, so "today" and "tomorrow"
// are correct regardless of what time the travel date carries or what time
// it currently is. Deliberately based on travelDate only, never createdAt.
export function formatTravelUrgency(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const days = differenceInCalendarDays(d, new Date())
  if (days < 0) return formatDate(d)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `In ${days} days`
}

export function formatNumber(value: number): string { return new Intl.NumberFormat('en-US').format(value) }

export function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : str.slice(0, maxLength) + '…'
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('')
}

const AVATAR_COLORS = ['#2563EB','#7C3AED','#DB2777','#EA580C','#16A34A','#0891B2','#D97706','#DC2626']
export function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
}
