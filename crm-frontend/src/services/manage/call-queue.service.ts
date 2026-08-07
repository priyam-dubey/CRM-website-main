import { apiClient } from "@/lib/api-client"
import type { CallQueue } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const callQueueService = {
  list:   (p: PaginationParams) => apiClient.get<PaginatedResponse<CallQueue>>("/manage/call-queues", { params: p }).then(r => r.data),
  create: (d: Record<string, unknown>) => apiClient.post<{ data: CallQueue }>("/manage/call-queues", d).then(r => r.data.data),
  update: (id: string, d: Record<string, unknown>) => apiClient.patch<{ data: CallQueue }>(`/manage/call-queues/${id}`, d).then(r => r.data.data),
  delete: (id: string) => apiClient.delete(`/manage/call-queues/${id}`),
}
