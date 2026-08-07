import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Download, Search } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { MetricCard } from "@/components/app/MetricCard"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/app/EmptyState"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { DollarSign, FileText, AlertTriangle } from "lucide-react"
import { useRevenueDetails } from "../hooks/useRevenue"
import { revenueService } from "@/services/revenue.service"
import { useUsers } from "@/features/users/hooks/useUsers"
import { useProviders } from "@/hooks/useReferenceData"
import type { DateRangePreset } from "@/types/revenue.types"

const RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "this_year", label: "This Year" },
]

export default function RevenueDetailsPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState<DateRangePreset>("today")
  const [agentId, setAgentId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [flags, setFlags] = useState({ refund: false, chargeback: false, ticketed_mco: false, pending: false })
  const [page, setPage] = useState(1)

  const { data: usersData } = useUsers({ per_page: 100 })
  const { data: providersData } = useProviders()
  const agents = usersData?.data ?? []
  const providers = providersData?.data ?? []

  const filters = {
    range,
    ...(agentId ? { agent_id: agentId } : {}),
    ...(providerId ? { provider_id: providerId } : {}),
    ...(flags.refund ? { refund: true } : {}),
    ...(flags.chargeback ? { chargeback: true } : {}),
    ...(flags.ticketed_mco ? { ticketed_mco: true } : {}),
    ...(flags.pending ? { pending: true } : {}),
  }

  const { data, isLoading, isError, refetch } = useRevenueDetails({ page, per_page: 10, ...filters })
  const rows = data?.data ?? []
  const totals = data?.totals
  const meta = data?.meta

  const toggleFlag = (key: keyof typeof flags) => setFlags(f => ({ ...f, [key]: !f[key] }))

  return (
    <div className="space-y-4">
      <PageHeader title="Lifetime Stats" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={totals ? formatCurrency(totals.totalRevenue, "USD") : "—"}
          icon={DollarSign} iconColor="text-primary" isLoading={isLoading} />
        <MetricCard label="Chargeback" value={totals ? formatCurrency(totals.totalChargebacks, "USD") : "—"}
          icon={AlertTriangle} iconColor="text-red-500" isLoading={isLoading} />
        <MetricCard label="Refund" value={totals ? formatCurrency(totals.totalRefunds, "USD") : "—"}
          icon={FileText} iconColor="text-amber-500" isLoading={isLoading} />
        <MetricCard label="Net Revenue" value={totals ? formatCurrency(totals.netRevenue, "USD") : "—"}
          icon={FileText} iconColor="text-green-600" isLoading={isLoading} />
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {RANGE_PRESETS.map(p => (
              <button key={p.value} onClick={() => { setRange(p.value); setPage(1) }}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  range === p.value ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {p.label}
              </button>
            ))}
          </div>
          <Button size="sm" leftIcon={<Search className="h-4 w-4" />} onClick={() => refetch()}>Search</Button>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Agent:</label>
            <select value={agentId} onChange={e => { setAgentId(e.target.value); setPage(1) }}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
              <option value="">All</option>
              {agents.map((a: any) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">Provider:</label>
            <select value={providerId} onChange={e => { setProviderId(e.target.value); setPage(1) }}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm">
              <option value="">All</option>
              {providers.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {([
            ["refund", "Refund"], ["chargeback", "Chargeback"],
            ["ticketed_mco", "Ticket and MCO Charged"], ["pending", "Pending"],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="checkbox" checked={flags[key]} onChange={() => { toggleFlag(key); setPage(1) }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">Revenue Details</h2>
          <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}
            onClick={() => revenueService.exportDetailsCsv(filters)}>
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">Failed to load revenue details.</div>
        ) : rows.length === 0 ? (
          <EmptyState title="No records found" description="Try adjusting your filters." />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Booking ID", "MCO", "Refund", "Chargeback", "Booking status", "Date", "Agent"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.bookingId} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/bookings/find`)}>
                    <td className="px-4 py-3 font-medium text-primary">{r.bookingId}</td>
                    <td className="px-4 py-3 text-green-600">{r.mco ? formatCurrency(r.mco, "USD") : "0"}</td>
                    <td className="px-4 py-3 text-amber-600">{r.refund ? formatCurrency(r.refund, "USD") : "0"}</td>
                    <td className="px-4 py-3 text-red-600">{r.chargeback ? formatCurrency(r.chargeback, "USD") : "0"}</td>
                    <td className="px-4 py-3"><Badge variant="default">{r.bookingStatus}</Badge></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.date, "MMM d, yyyy HH:mm")}</td>
                    <td className="px-4 py-3 text-slate-700">{r.agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-500">
                <span>Showing {(meta.page - 1) * meta.per_page + 1} to {Math.min(meta.page * meta.per_page, meta.total_count)} of {meta.total_count} records</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span>{page}</span>
                  <Button variant="outline" size="sm" disabled={page * meta.per_page >= meta.total_count} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
