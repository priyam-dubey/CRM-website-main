import { useState } from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import { Bell, Check, X }   from "lucide-react"
import { Skeleton }         from "@/components/ui/Skeleton"
import { formatRelativeTime } from "@/lib/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationService } from "@/services/notification.service"
import { useAuth }             from "@/features/auth/hooks/useAuth"
import { cn }                  from "@/lib/utils"
import { NOTIFICATION_POLL_MS } from "@/config/constants"
import type { Notification }   from "@/types/shared.types"

const SEV_COLORS: Record<string, string> = {
  INFO: "bg-blue-400", SUCCESS: "bg-green-500",
  WARNING: "bg-amber-400", ERROR: "bg-red-500",
}

export function NotificationCenter() {
  const { user }  = useAuth()
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey:       ["notifications", "list", { page: 1, per_page: 20 }],
    queryFn:        () => notificationService.list({ page: 1, per_page: 20 }),
    staleTime:      0,
    refetchInterval: NOTIFICATION_POLL_MS,
    enabled: !!user,
  })

  const markRead    = useMutation({ mutationFn: notificationService.markRead,    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) })
  const markAllRead = useMutation({ mutationFn: notificationService.markAllRead, onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) })
  const dismiss     = useMutation({ mutationFn: notificationService.dismiss,     onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) })

  const notifications = data?.data ?? []
  const unread        = (data?.meta as any)?.unread_count ?? 0

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button className="relative flex items-center justify-center h-9 w-9 rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="end" sideOffset={8}
          className="z-50 w-80 rounded-md border border-slate-200 bg-white shadow-lg">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">
              Notifications {unread > 0 && <span className="ml-1 text-xs font-normal text-slate-400">({unread} unread)</span>}
            </h3>
            {unread > 0 && (
              <button onClick={() => markAllRead.mutate(undefined)}
                className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-3">
                {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No notifications</p>
            ) : notifications.map((n: Notification) => (
              <div key={n.id}
                className={cn("flex gap-3 px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors",
                  !n.readAt && "bg-blue-50/40")}>
                {/* Severity dot */}
                <div className="mt-1.5 shrink-0">
                  <span className={cn("block h-2 w-2 rounded-full", SEV_COLORS[n.severity] ?? "bg-slate-300")} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 leading-snug">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  {!n.readAt && (
                    <button onClick={() => markRead.mutate(n.id)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors" aria-label="Mark as read">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => dismiss.mutate(n.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors" aria-label="Dismiss">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
