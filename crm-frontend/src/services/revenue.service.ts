import { apiClient } from "@/lib/api-client"
import type { Revenue, Chargeback, Refund, MCO, RevenueDashboard, RevenueDetailsRow, RevenueDetailsFilters, RevenueDetailsTotals } from "@/types/revenue.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const revenueService = {
  list: (params: PaginationParams & { booking_id?: string; currency_id?: string; type?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<PaginatedResponse<Revenue>>("/revenue", { params }).then(r => r.data),

  dashboard: (params: { currencyId?: string; period?: string; range?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<{ data: RevenueDashboard }>("/revenue/dashboard", { params }).then(r => r.data.data),

  // Revenue Details — the client's filterable, paginated booking-level table
  details: (params: PaginationParams & RevenueDetailsFilters) =>
    apiClient.get<{ data: RevenueDetailsRow[]; meta: PaginatedResponse<never>["meta"]; totals: RevenueDetailsTotals }>("/revenue/details", { params }).then(r => r.data),

  exportDetailsCsv: async (params: RevenueDetailsFilters) => {
    const res = await apiClient.get("/revenue/details/export", { params, responseType: "blob" })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `revenue-details-${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
  },

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ data: Revenue }>("/revenue", data).then(r => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ data: Revenue }>(`/revenue/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/revenue/${id}`),

  // MCOs
  listMcos: (params: PaginationParams) =>
    apiClient.get<PaginatedResponse<MCO>>("/revenue/mcos", { params }).then(r => r.data),

  createMco: (data: Record<string, unknown>) =>
    apiClient.post<{ data: MCO }>("/revenue/mcos", data).then(r => r.data.data),

  // Chargebacks
  listChargebacks: (params: PaginationParams) =>
    apiClient.get<PaginatedResponse<Chargeback>>("/revenue/chargebacks", { params }).then(r => r.data),

  createChargeback: (data: Record<string, unknown>) =>
    apiClient.post<{ data: Chargeback }>("/revenue/chargebacks", data).then(r => r.data.data),

  // Refunds
  listRefunds: (params: PaginationParams) =>
    apiClient.get<PaginatedResponse<Refund>>("/revenue/refunds", { params }).then(r => r.data),

  createRefund: (data: Record<string, unknown>) =>
    apiClient.post<{ data: Refund }>("/revenue/refunds", data).then(r => r.data.data),
}
