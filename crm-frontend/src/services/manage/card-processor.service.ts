import { apiClient } from "@/lib/api-client"
import type { CardProcessor } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const cardProcessorService = {
  list:   (p: PaginationParams) => apiClient.get<PaginatedResponse<CardProcessor>>("/manage/card-processors", { params: p }).then(r => r.data),
  create: (d: Record<string, unknown>) => apiClient.post<{ data: CardProcessor }>("/manage/card-processors", d).then(r => r.data.data),
  update: (id: string, d: Record<string, unknown>) => apiClient.patch<{ data: CardProcessor }>(`/manage/card-processors/${id}`, d).then(r => r.data.data),
  delete: (id: string) => apiClient.delete(`/manage/card-processors/${id}`),
}
