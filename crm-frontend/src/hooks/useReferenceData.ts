import { useQuery } from "@tanstack/react-query"
import { referenceKeys } from "@/lib/query-keys"
import { airlineService }      from "@/services/manage/airline.service"
import { classService }        from "@/services/manage/class.service"
import { currencyService }     from "@/services/manage/currency.service"
import { providerService }     from "@/services/manage/provider.service"
import { cardProcessorService } from "@/services/manage/card-processor.service"
import { callQueueService }    from "@/services/manage/call-queue.service"

const REF_PARAMS = { page: 1, per_page: 100 }

export function useAirlines() {
  return useQuery({
    queryKey:  referenceKeys.airlines(),
    queryFn:   () => airlineService.list({ ...REF_PARAMS, isActive: true }),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  })
}

export function useBookingClasses() {
  return useQuery({
    queryKey:  referenceKeys.classes(),
    queryFn:   () => classService.list(REF_PARAMS),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  })
}

export function useCurrencies() {
  return useQuery({
    queryKey:  referenceKeys.currencies(),
    queryFn:   () => currencyService.list(REF_PARAMS),
    staleTime: 60 * 60 * 1000,
    gcTime:    60 * 60 * 1000,
  })
}

export function useProviders() {
  return useQuery({
    queryKey:  referenceKeys.providers(),
    queryFn:   () => providerService.list(REF_PARAMS),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  })
}

export function useCardProcessors() {
  return useQuery({
    queryKey:  referenceKeys.cardProcessors(),
    queryFn:   () => cardProcessorService.list(REF_PARAMS),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  })
}

export function useCallQueues() {
  return useQuery({
    queryKey:  referenceKeys.callQueues(),
    queryFn:   () => callQueueService.list(REF_PARAMS),
    staleTime: 5 * 60 * 1000,
    gcTime:    30 * 60 * 1000,
  })
}
