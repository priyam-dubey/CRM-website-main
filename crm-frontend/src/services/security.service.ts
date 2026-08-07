import { apiClient } from "@/lib/api-client"
import type { IPRule, Session } from "@/types/shared.types"
import type { SecurityLog }     from "@/types/activity.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const securityService = {
  ipSettingsSummary: () =>
    apiClient.get<{ data: { enabled: boolean; allowedCount: number; blockedCount: number; lastUpdatedAt: string | null } }>("/security/ip-settings-summary").then(r => r.data.data),

  toggleIpRestriction: (enabled: boolean) =>
    apiClient.patch<{ data: { enabled: boolean } }>("/security/ip-restriction", { enabled }).then(r => r.data.data),

  listIpRules: (params: PaginationParams) =>
    apiClient.get<PaginatedResponse<IPRule>>("/security/ip-rules", { params }).then(r => r.data),

  createIpRule: (data: Record<string, unknown>) =>
    apiClient.post<{ data: IPRule }>("/security/ip-rules", data).then(r => r.data.data),

  updateIpRule: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ data: IPRule }>(`/security/ip-rules/${id}`, data).then(r => r.data.data),

  deleteIpRule: (id: string) =>
    apiClient.delete(`/security/ip-rules/${id}`),

  listLogs: (params: PaginationParams & { event?: string; userId?: string; date_from?: string; date_to?: string }) =>
    apiClient.get<PaginatedResponse<SecurityLog>>("/security/logs", { params }).then(r => r.data),

  listSessions: (params: PaginationParams & { userId?: string }) =>
    apiClient.get<PaginatedResponse<Session>>("/security/sessions", { params }).then(r => r.data),

  revokeSession: (id: string) =>
    apiClient.delete(`/security/sessions/${id}`),

  revokeAllSessions: (userId: string) =>
    apiClient.post("/security/sessions/revoke-all", { userId }),
}
