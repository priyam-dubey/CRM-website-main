import { apiClient }   from "@/lib/api-client"
import type { BookingNote } from "@/types/note.types"

export const bookingNotesService = {
  list: (bookingId: string) =>
    apiClient.get<BookingNote[]>(`/bookings/${bookingId}/notes`).then(r => {
      // API wraps in { data: [...] } via ResponseInterceptor
      const raw = r.data as any
      return (Array.isArray(raw) ? raw : raw.data ?? []) as BookingNote[]
    }),

  create: (bookingId: string, note: string) =>
    apiClient.post<{ data: BookingNote }>(`/bookings/${bookingId}/notes`, { note }).then(r => r.data.data ?? r.data),

  update: (id: string, note: string) =>
    apiClient.patch<{ data: BookingNote }>(`/notes/${id}`, { note }).then(r => r.data.data ?? r.data),

  delete: (id: string) =>
    apiClient.delete(`/notes/${id}`),
}
