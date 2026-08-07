import { apiClient } from "@/lib/api-client"
import type { ActivityLog }     from "@/types/activity.types"
import type { CursorPaginatedResponse } from "@/types/api.types"

export const activityService = {
  list: (params: { cursor?: string; limit?: number; entityType?: string; actorId?: string; action?: string }) =>
    apiClient.get<CursorPaginatedResponse<ActivityLog>>("/activity", { params }).then(r => r.data),

  listMine: (params: { cursor?: string; limit?: number }) =>
    apiClient.get<CursorPaginatedResponse<ActivityLog>>("/activity/me", { params }).then(r => r.data),
}
