import { apiClient } from "@/lib/api-client"
import type { Airline } from "@/types/shared.types"
import type { PaginatedResponse } from "@/types/api.types"

export interface AirlineFilters {
  page?:     number
  per_page?: number
  search?:   string
  isActive?: boolean
  country?:  string
  sort_by?:  string
  sort_dir?: "asc" | "desc"
}

export const airlineService = {
  list: (params: AirlineFilters = {}) =>
    apiClient.get<PaginatedResponse<Airline>>("/manage/airlines", { params }).then(r => r.data),

  get: (id: string) =>
    apiClient.get<{ data: Airline }>(`/manage/airlines/${id}`).then(r => r.data.data),

  create: (data: {
    airlineName: string; iataCode: string; icaoCode?: string; country: string; logoUrl?: string
  }) =>
    apiClient.post<{ data: Airline }>("/manage/airlines", data).then(r => r.data.data),

  update: (id: string, data: Partial<{
    airlineName: string; iataCode: string; icaoCode: string; country: string; logoUrl: string; isActive: boolean
  }>) =>
    apiClient.patch<{ data: Airline }>(`/manage/airlines/${id}`, data).then(r => r.data.data),

  toggleActive: (id: string, isActive: boolean) =>
    apiClient.patch<{ data: Airline }>(`/manage/airlines/${id}/toggle-active`, { isActive }).then(r => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/manage/airlines/${id}`),
}
