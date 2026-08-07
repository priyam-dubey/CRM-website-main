import { apiClient }        from "@/lib/api-client"
import type { Notification } from "@/types/shared.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const notificationService = {
  list: (params: PaginationParams) =>
    apiClient.get<PaginatedResponse<Notification> & { meta: { unread_count: number } }>("/notifications", { params }).then(r => r.data),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch("/notifications/read-all"),

  dismiss: (id: string) =>
    apiClient.delete(`/notifications/${id}`),
}
