import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { bookingService }  from "@/services/booking.service"
import { bookingKeys }     from "@/lib/query-keys"
import { QUERY_STALE_TIMES } from "@/config/constants"
import { toast }           from "sonner"
import type { BookingFilters } from "@/types/booking.types"
import type { PaginationParams } from "@/types/api.types"

export function useBookings(params: PaginationParams & BookingFilters) {
  return useQuery({
    queryKey:  bookingKeys.list(params),
    queryFn:   () => bookingService.list(params),
    staleTime: QUERY_STALE_TIMES.list,
  })
}

export function useBooking(id: string) {
  return useQuery({
    queryKey:  bookingKeys.detail(id),
    queryFn:   () => bookingService.get(id),
    staleTime: QUERY_STALE_TIMES.detail,
    enabled:   !!id,
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all() })
      toast.success("Booking created successfully")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to create booking")
    },
  })
}

export function useUpdateBooking(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => bookingService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      qc.invalidateQueries({ queryKey: bookingKeys.all() })
      toast.success("Booking updated")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to update booking")
    },
  })
}

export function useCancelBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingService.cancel,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) })
      qc.invalidateQueries({ queryKey: bookingKeys.all() })
      toast.success("Booking cancelled")
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to cancel booking")
    },
  })
}

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bookingKeys.all() })
      toast.success("Booking deleted")
    },
    onError: () => toast.error("Failed to delete booking"),
  })
}

export function useBulkDeleteBookings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingService.bulkDelete,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: bookingKeys.all() })
      toast.success(`${data.deleted} bookings deleted`)
    },
    onError: () => toast.error("Bulk delete failed"),
  })
}
