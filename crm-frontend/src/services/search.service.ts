import { apiClient } from "@/lib/api-client"

export interface GlobalSearchResult {
  bookings: Array<{ id: string; reference: string; passengerName: string; status: string; pnr: string }>
  users:    Array<{ id: string; firstName: string; lastName: string; email: string; role: string }>
  airlines: Array<{ id: string; airlineName: string; iataCode: string }>
}

export const searchService = {
  global: (q: string) =>
    apiClient.get<{ data: GlobalSearchResult }>("/search/global", { params: { q } }).then(r => r.data.data),
}
