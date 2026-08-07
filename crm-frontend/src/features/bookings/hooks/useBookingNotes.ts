import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { bookingNotesService } from "@/services/booking-notes.service"
import { toast } from "sonner"
import type { BookingNote } from "@/types/note.types"

const noteKeys = {
  all:  (bookingId: string) => ["booking-notes", bookingId] as const,
}

export function useBookingNotes(bookingId: string) {
  return useQuery({
    queryKey: noteKeys.all(bookingId),
    queryFn:  () => bookingNotesService.list(bookingId),
    enabled:  !!bookingId,
    staleTime: 0,
  })
}

export function useCreateNote(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (note: string) => bookingNotesService.create(bookingId, note),
    // Optimistic update
    onMutate: async (note) => {
      await qc.cancelQueries({ queryKey: noteKeys.all(bookingId) })
      const prev = qc.getQueryData<BookingNote[]>(noteKeys.all(bookingId))
      const optimistic: BookingNote = {
        id: `temp-${Date.now()}`, bookingId, userId: "me", note,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        deletedAt: null,
        user: { id: "me", firstName: "You", lastName: "", role: "OPERATOR" },
      }
      qc.setQueryData(noteKeys.all(bookingId), (old: BookingNote[] = []) => [...old, optimistic])
      return { prev }
    },
    onError: (_err, _note, ctx) => {
      if (ctx?.prev) qc.setQueryData(noteKeys.all(bookingId), ctx.prev)
      toast.error("Failed to add note")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: noteKeys.all(bookingId) })
    },
  })
}

export function useUpdateNote(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => bookingNotesService.update(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: noteKeys.all(bookingId) })
      toast.success("Note updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update note"),
  })
}

export function useDeleteNote(bookingId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookingNotesService.delete,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: noteKeys.all(bookingId) })
      const prev = qc.getQueryData<BookingNote[]>(noteKeys.all(bookingId))
      qc.setQueryData(noteKeys.all(bookingId), (old: BookingNote[] = []) =>
        old.filter(n => n.id !== id)
      )
      return { prev }
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(noteKeys.all(bookingId), ctx.prev)
      toast.error("Failed to delete note")
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: noteKeys.all(bookingId) })
    },
  })
}
