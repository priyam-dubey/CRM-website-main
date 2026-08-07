export type RevenueType = 'FARE'|'TAX'|'FEE'|'MCO'|'CHARGEBACK'|'REFUND'|'ADJUSTMENT'
export type ChargebackStatus = 'OPEN'|'UNDER_REVIEW'|'WON'|'LOST'
export type RefundStatus = 'PENDING'|'APPROVED'|'REJECTED'|'PROCESSED'
export interface Revenue {
  id: string; companyId: string; bookingId: string; currencyId: string; type: RevenueType;
  grossAmount: number; netAmount: number; description: string|null; entryDate: string;
  createdById: string; createdAt: string; updatedAt: string;
  currency?: { id: string; code: string; symbol: string; decimalPlaces: number }
}
export interface Chargeback {
  id: string; companyId: string; bookingId: string; cardProcessorId: string; amount: number;
  currencyId: string; status: ChargebackStatus; reason: string|null; filedAt: string;
  resolvedAt: string|null; createdById: string; createdAt: string; updatedAt: string
}
export interface Refund {
  id: string; companyId: string; bookingId: string; amount: number; currencyId: string;
  status: RefundStatus; reason: string|null; requestedAt: string; processedAt: string|null;
  createdById: string; createdAt: string; updatedAt: string
}
export interface RevenueChartDataPoint { date: string; gross: number; net: number; chargebacks: number }
export interface PerformerStat { agentId: string; name: string; mcoRevenue: number; totalBookings: number }
export interface RevenueDashboard {
  totals: { gross: number; net: number; chargebacks: number; refunds: number }
  chartData: RevenueChartDataPoint[]
  totalBookings?: number
  activeAgents?: number
  topPerformers?: PerformerStat[]
  bottomPerformers?: PerformerStat[]
}
export type DateRangePreset = 'today'|'last_30_days'|'this_month'|'last_12_months'|'this_year'|'custom'
export interface RevenueDetailsRow {
  bookingId: string; mco: number; refund: number; chargeback: number
  bookingStatus: string; date: string; agent: string
}
export interface RevenueDetailsTotals {
  totalRevenue: number; totalBookings: number; netRevenue: number
  totalRefunds: number; totalChargebacks: number; refundsAndChargebacks: number
}
export interface RevenueDetailsFilters {
  agent_id?: string; provider_id?: string; range?: string; date_from?: string; date_to?: string
  refund?: boolean; chargeback?: boolean; ticketed_mco?: boolean; pending?: boolean
}
export interface MCO {
  id: string; companyId: string; bookingId: string; airlineId: string; mcoNumber: string;
  amount: number; currencyId: string; reason: string|null; issuedAt: string;
  createdById: string; createdAt: string; updatedAt: string
}
