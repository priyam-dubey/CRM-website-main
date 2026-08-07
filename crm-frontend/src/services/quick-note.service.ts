import { apiClient } from '@/lib/api-client'
import type { QuickNote } from '@/types/quick-note.types'
import type { PaginatedResponse } from '@/types/api.types'

export const quickNoteService = {
  list: (page: number = 1, per_page: number = 25, userId?: string): Promise<QuickNote[]> =>
    apiClient
      .get<PaginatedResponse<QuickNote>>('/quick-notes', { params: { page, per_page, userId } })
      .then(r => r.data.data ?? []),

  create: (note: string): Promise<QuickNote> =>
    apiClient.post<{ data: QuickNote }>('/quick-notes', { note }).then(r => r.data.data),

  update: (id: string, note: string): Promise<QuickNote> =>
    apiClient.patch<{ data: QuickNote }>(`/quick-notes/${id}`, { note }).then(r => r.data.data),

  delete: (id: string): Promise<void> => apiClient.delete(`/quick-notes/${id}`),
};
