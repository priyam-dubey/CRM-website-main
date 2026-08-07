import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { revenueService } from "@/services/revenue.service"
import { revenueKeys }    from "@/lib/query-keys"
import { toast }          from "sonner"

export function useRevenueDashboard(params: { currencyId?: string; period?: string; range?: string; date_from?: string; date_to?: string } = {}) {
  return useQuery({
    queryKey:  revenueKeys.dashboard(params),
    queryFn:   () => revenueService.dashboard(params),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useRevenueDetails(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: revenueKeys.detailsList(params),
    queryFn:  () => revenueService.details({ page: 1, per_page: 10, ...params as any }),
  })
}

export function useRevenueList(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: revenueKeys.list(params),
    queryFn:  () => revenueService.list(params as any),
  })
}

export function useChargebacks(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: revenueKeys.chargebacks(params),
    queryFn:  () => revenueService.listChargebacks({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useRefunds(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: revenueKeys.refunds(params),
    queryFn:  () => revenueService.listRefunds({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useMcos(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: revenueKeys.mcos(params),
    queryFn:  () => revenueService.listMcos({ page: 1, per_page: 25, ...params as any }),
  })
}

export function useCreateChargeback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: revenueService.createChargeback,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.all() })
      toast.success("Chargeback filed")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to file chargeback"),
  })
}

export function useCreateRefund() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: revenueService.createRefund,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.all() })
      toast.success("Refund requested")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to request refund"),
  })
}
