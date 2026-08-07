import { PageHeader }  from "@/components/app/PageHeader"
import { Badge }       from "@/components/ui/Badge"
import { Skeleton }    from "@/components/ui/Skeleton"
import { ErrorState }  from "@/components/app/ErrorState"
import { useSecurityLogs } from "../hooks/useSecurity"
import { formatDateTime } from "@/lib/utils"

const EVENT_COLORS: Record<string, string> = {
  LOGIN: "success", LOGOUT: "default", FAILED_LOGIN: "error",
  IP_BLOCKED: "error", SESSION_REVOKED: "warning", PASSWORD_CHANGED: "info",
}

export default function SecurityLogsPage() {
  const { data, isLoading, isError, refetch } = useSecurityLogs()

  if (isError) return <ErrorState title="Failed to load security logs" onRetry={refetch} />

  return (
    <div className="space-y-4">
      <PageHeader title="Security Logs" subtitle="Authentication and security events" />
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Event","User","IP Address","User Agent","Time"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map(log => (
                <tr key={log.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Badge variant={EVENT_COLORS[log.event] as any} dot>{log.event.replace("_"," ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.userId ?? <span className="text-slate-400">Anonymous</span>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-900">{log.ipAddress}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[200px]">{log.userAgent ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDateTime(log.createdAt)}</td>
                </tr>
              ))}
              {(data?.data ?? []).length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No security events</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
