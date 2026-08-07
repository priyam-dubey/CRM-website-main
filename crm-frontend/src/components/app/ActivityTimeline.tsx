import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import { ACTIVITY_ACTION_LABELS } from '@/config/constants'
import type { ActivityLog } from '@/types/activity.types'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'

interface ActivityTimelineProps { events: ActivityLog[]; isLoading?: boolean; compact?: boolean; className?: string }

export function ActivityTimeline({ events, isLoading, compact, className }: ActivityTimelineProps) {
  if (isLoading) return (
    <div className={cn('space-y-4', className)}>
      {[...Array(5)].map((_,i) => <div key={i} className="flex gap-3"><Skeleton className="h-8 w-8 rounded-full shrink-0" /><div className="flex-1 space-y-1.5 pt-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /></div></div>)}
    </div>
  )
  if (!events.length) return <p className="text-sm text-slate-400 text-center py-8">No activity yet</p>
  return (
    <div className={cn('space-y-4', className)}>
      {events.map(event => (
        <div key={event.id} className="flex gap-3">
          <Avatar name={event.actorName} size="sm" className="shrink-0 z-10" />
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-sm font-medium text-slate-900">{event.actorName}</span>{" "}
                <span className="text-sm text-slate-500">{(ACTIVITY_ACTION_LABELS[event.action] ?? event.action).toLowerCase()}
                  {event.entityLabel && <span className="font-medium text-slate-700"> {event.entityLabel}</span>}
                </span>
              </div>
              <time className="text-xs text-slate-400 whitespace-nowrap shrink-0" title={formatDateTime(event.createdAt)}>
                {formatRelativeTime(event.createdAt)}
              </time>
            </div>
            {!compact && event.ipAddress && <p className="mt-0.5 text-xs text-slate-400">{event.ipAddress}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
