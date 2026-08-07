import { apiClient } from "@/lib/api-client"
import type { Currency } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const currencyService = {
  list:   (p: PaginationParams) => apiClient.get<PaginatedResponse<Currency>>("/manage/currencies", { params: p }).then(r => r.data),
  create: (d: Record<string, unknown>) => apiClient.post<{ data: Currency }>("/manage/currencies", d).then(r => r.data.data),
  update: (id: string, d: Record<string, unknown>) => apiClient.patch<{ data: Currency }>(`/manage/currencies/${id}`, d).then(r => r.data.data),
  delete: (id: string) => apiClient.delete(`/manage/currencies/${id}`),
}
