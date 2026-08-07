import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { securityService } from "@/services/security.service"
import { securityKeys }    from "@/lib/query-keys"
import { toast }           from "sonner"

export function useIpSettingsSummary() {
  return useQuery({
    queryKey: ["security", "ip-settings-summary"],
    queryFn:  () => securityService.ipSettingsSummary(),
  })
}

export function useToggleIpRestriction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) => securityService.toggleIpRestriction(enabled),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "ip-settings-summary"] })
      toast.success("IP restriction setting updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update setting"),
  })
}

export function useUpdateIpRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => securityService.updateIpRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "ip-rules"] })
      qc.invalidateQueries({ queryKey: ["security", "ip-settings-summary"] })
      toast.success("IP rule updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update IP rule"),
  })
}

export function useIpRules(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: securityKeys.ipRules(params),
    queryFn:  () => securityService.listIpRules({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useCreateIpRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: securityService.createIpRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "ip-rules"] })
      qc.invalidateQueries({ queryKey: ["security", "ip-settings-summary"] })
      toast.success("IP rule created")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create IP rule"),
  })
}

export function useDeleteIpRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: securityService.deleteIpRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "ip-rules"] })
      qc.invalidateQueries({ queryKey: ["security", "ip-settings-summary"] })
      toast.success("IP rule deleted")
    },
    onError: () => toast.error("Failed to delete IP rule"),
  })
}

export function useSecurityLogs(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: securityKeys.logs(params),
    queryFn:  () => securityService.listLogs({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useSessions(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: securityKeys.sessions(params),
    queryFn:  () => securityService.listSessions({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useRevokeSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: securityService.revokeSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["security", "sessions"] })
      toast.success("Session revoked")
    },
    onError: () => toast.error("Failed to revoke session"),
  })
}
