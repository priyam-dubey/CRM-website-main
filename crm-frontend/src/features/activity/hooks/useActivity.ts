import { useQuery } from "@tanstack/react-query"
import { activityService } from "@/services/activity.service"
import { activityKeys }    from "@/lib/query-keys"

export function useActivity(params: { cursor?: string; limit?: number; entityType?: string; actorId?: string; action?: string } = {}) {
  return useQuery({
    queryKey: activityKeys.list(params),
    queryFn:  () => activityService.list(params),
    staleTime: 0,
  })
}

export function useMyActivity(params: { cursor?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: activityKeys.me(params),
    queryFn:  () => activityService.listMine(params),
    staleTime: 0,
  })
}
