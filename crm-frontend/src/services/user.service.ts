import { apiClient } from "@/lib/api-client"
import type { User } from "@/types/user.types"
import type { PaginatedResponse, PaginationParams } from "@/types/api.types"

export const userService = {
  list: (params: PaginationParams & { role?: string; is_active?: boolean; search?: string }) =>
    apiClient.get<PaginatedResponse<User>>("/users", { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<{ data: User }>(`/users/${id}`).then(r => r.data.data),

  me: () =>
    apiClient.get<{ data: User }>("/users/me").then(r => r.data.data),

  create: (data: Record<string, unknown>) =>
    apiClient.post<{ data: User }>("/users", data).then(r => r.data.data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<{ data: User }>(`/users/${id}`, data).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),
}
