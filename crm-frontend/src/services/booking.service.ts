import { apiClient } from "@/lib/api-client"
import type { Booking, BookingFilters, CreateBookingInput } from "@/types/booking.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const bookingService = {
  list: (params: PaginationParams & BookingFilters) =>
    apiClient.get<PaginatedResponse<Booking>>("/bookings", { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<{ data: Booking }>(`/bookings/${id}`).then(r => r.data.data),

  create: (data: CreateBookingInput) =>
    apiClient.post<{ data: Booking }>("/bookings", data).then(r => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ data: Booking }>(`/bookings/${id}`, data).then(r => r.data.data),

  cancel: (id: string) =>
    apiClient.post<{ data: Booking }>(`/bookings/${id}/cancel`).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/bookings/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.post<{ data: { deleted: number } }>("/bookings/bulk-delete", { ids }).then(r => r.data.data),

  bulkAssign: (ids: string[], assignedToId: string | null) =>
    apiClient.post<{ data: { updated: number } }>("/bookings/bulk-assign", { ids, assignedToId }).then(r => r.data.data),

  sendVerification: (id: string) =>
    apiClient.post<{ data: { id: string; status: string; clientEmail: string; createdAt: string } }>(
      `/bookings/${id}/send-verification`,
    ).then(r => r.data.data),
}
