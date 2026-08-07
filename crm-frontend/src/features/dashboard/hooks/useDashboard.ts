import { useQuery }        from "@tanstack/react-query"
import { dashboardKeys }   from "@/lib/query-keys"
import { bookingService }  from "@/services/booking.service"
import { revenueService }  from "@/services/revenue.service"
import { activityService } from "@/services/activity.service"

export function useDashboardBookings() {
  return useQuery({
    queryKey: ["dashboard", "recent-bookings"],
    queryFn:  () => bookingService.list({ page: 1, per_page: 8, sort_by: "createdAt", sort_dir: "desc" }),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useDashboardRevenue(range: string = "last_30_days") {
  return useQuery({
    queryKey: dashboardKeys.metrics(range),
    queryFn:  () => revenueService.dashboard({ range }),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useDashboardActivity() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn:  () => activityService.list({ limit: 10 }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}
