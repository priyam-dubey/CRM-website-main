import { apiClient } from "@/lib/api-client"
import type { BookingClass } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const classService = {
  list:   (p: PaginationParams) => apiClient.get<PaginatedResponse<BookingClass>>("/manage/classes", { params: p }).then(r => r.data),
  create: (d: Record<string, unknown>) => apiClient.post<{ data: BookingClass }>("/manage/classes", d).then(r => r.data.data),
  update: (id: string, d: Record<string, unknown>) => apiClient.patch<{ data: BookingClass }>(`/manage/classes/${id}`, d).then(r => r.data.data),
  delete: (id: string) => apiClient.delete(`/manage/classes/${id}`),
}
