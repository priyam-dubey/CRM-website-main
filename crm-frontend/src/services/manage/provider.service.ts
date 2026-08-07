import { apiClient } from "@/lib/api-client"
import type { Provider } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const providerService = {
  list:   (p: PaginationParams) => apiClient.get<PaginatedResponse<Provider>>("/manage/providers", { params: p }).then(r => r.data),
  create: (d: Record<string, unknown>) => apiClient.post<{ data: Provider }>("/manage/providers", d).then(r => r.data.data),
  update: (id: string, d: Record<string, unknown>) => apiClient.patch<{ data: Provider }>(`/manage/providers/${id}`, d).then(r => r.data.data),
  delete: (id: string) => apiClient.delete(`/manage/providers/${id}`),
}
