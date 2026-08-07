import { useMutation } from "@tanstack/react-query"
import { quickNoteService } from "@/services/quick-note.service"

export function useCreateQuickNote() {
  return useMutation({
    mutationFn: (note: string) => quickNoteService.create(note),
  })
}
