import { useState } from "react"
import { PageHeader }       from "@/components/app/PageHeader"
import { ActivityTimeline } from "@/components/app/ActivityTimeline"
import { ErrorState }       from "@/components/app/ErrorState"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { useActivity }      from "../hooks/useActivity"
import { ACTIVITY_ACTION_LABELS } from "@/config/constants"

export default function ActivityPage() {
  const [actionFilter, setActionFilter] = useState("")
  const { data, isLoading, isError, refetch } = useActivity({
    limit: 50,
    ...(actionFilter ? { action: actionFilter } : {}),
  })

  if (isError) return <ErrorState title="Failed to load activity" onRetry={refetch} />

  return (
    <div className="space-y-4">
      <PageHeader title="Activity Log" subtitle="Audit trail of all system actions"
        actions={
          <Select value={actionFilter || "ALL"} onValueChange={v => setActionFilter(v === "ALL" ? "" : v)}>
            <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All actions</SelectItem>
              {Object.entries(ACTIVITY_ACTION_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        } />
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
        <ActivityTimeline events={data?.data ?? []} isLoading={isLoading} />
        {!isLoading && data?.has_more && (
          <p className="mt-4 text-xs text-center text-slate-400">
            Showing latest 50 records
          </p>
        )}
      </div>
    </div>
  )
}
