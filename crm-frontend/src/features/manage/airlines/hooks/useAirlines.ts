import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { airlineService, type AirlineFilters } from "@/services/manage/airline.service"
import { toast } from "sonner"

const AIRLINE_KEYS = {
  all:    ()               => ["airlines"] as const,
  list:   (f: AirlineFilters) => ["airlines", "list", f] as const,
  detail: (id: string)     => ["airlines", "detail", id] as const,
}

export function useAirlineList(filters: AirlineFilters = {}) {
  return useQuery({
    queryKey:  AIRLINE_KEYS.list(filters),
    queryFn:   () => airlineService.list(filters),
    staleTime: 30_000,
  })
}

export function useAirline(id: string) {
  return useQuery({
    queryKey: AIRLINE_KEYS.detail(id),
    queryFn:  () => airlineService.get(id),
    enabled:  !!id,
  })
}

export function useCreateAirline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: airlineService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AIRLINE_KEYS.all() })
      toast.success("Airline created")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create airline"),
  })
}

export function useUpdateAirline(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof airlineService.update>[1]) => airlineService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AIRLINE_KEYS.all() })
      toast.success("Airline updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update airline"),
  })
}

export function useToggleAirlineActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      airlineService.toggleActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: AIRLINE_KEYS.all() })
      toast.success(isActive ? "Airline activated" : "Airline deactivated")
    },
    onError: () => toast.error("Failed to update airline status"),
  })
}

export function useDeleteAirline() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: airlineService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AIRLINE_KEYS.all() })
      toast.success("Airline deleted")
    },
    onError: () => toast.error("Failed to delete airline"),
  })
}
