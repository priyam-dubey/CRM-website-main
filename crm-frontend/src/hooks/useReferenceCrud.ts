import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { classService }         from "@/services/manage/class.service"
import { currencyService }      from "@/services/manage/currency.service"
import { providerService }      from "@/services/manage/provider.service"
import { cardProcessorService } from "@/services/manage/card-processor.service"
import { callQueueService }     from "@/services/manage/call-queue.service"
import { referenceKeys } from "@/lib/query-keys"

export type ReferenceSection = "classes" | "currencies" | "providers" | "card-processors" | "call-queues"

const SERVICES = {
  "classes":         classService,
  "currencies":       currencyService,
  "providers":       providerService,
  "card-processors": cardProcessorService,
  "call-queues":     callQueueService,
} as const

const KEY_FNS = {
  "classes":         referenceKeys.classes,
  "currencies":       referenceKeys.currencies,
  "providers":       referenceKeys.providers,
  "card-processors": referenceKeys.cardProcessors,
  "call-queues":     referenceKeys.callQueues,
} as const

export function useReferenceCrud(section: ReferenceSection) {
  const qc = useQueryClient()
  const service = SERVICES[section] as {
    create: (d: Record<string, unknown>) => Promise<unknown>
    update: (id: string, d: Record<string, unknown>) => Promise<unknown>
    delete: (id: string) => Promise<unknown>
  }
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY_FNS[section]() })

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => service.create(data),
    onSuccess: () => { invalidate(); toast.success("Created successfully") },
    onError:   (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create"),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => service.update(id, data),
    onSuccess: () => { invalidate(); toast.success("Updated successfully") },
    onError:   (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update"),
  })

  const remove = useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => { invalidate(); toast.success("Deleted successfully") },
    onError:   (err: any) => toast.error(err?.response?.data?.message ?? "Failed to delete"),
  })

  return { create, update, remove }
}
