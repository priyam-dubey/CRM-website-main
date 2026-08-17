import { useState } from "react"
import { BookOpen, DollarSign, Users2, AlertTriangle, Trophy, TrendingDown as TrendingDownIcon } from "lucide-react"
import { Link }             from "react-router-dom"
import { PageHeader }       from "@/components/app/PageHeader"
import { MetricCard }       from "@/components/app/MetricCard"
import { ActivityTimeline } from "@/components/app/ActivityTimeline"
import { Badge }            from "@/components/ui/Badge"
import { Skeleton }         from "@/components/ui/Skeleton"
import { ErrorState }       from "@/components/app/ErrorState"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/config/constants"
import { useDashboardBookings, useDashboardRevenue, useDashboardActivity } from "../hooks/useDashboard"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { BadgeProps } from "@/components/ui/Badge"
import type { DateRangePreset } from "@/types/revenue.types"

const RANGE_PRESETS: { value: Exclude<DateRangePreset, "custom">; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_12_months", label: "Last 12 Months" },
  { value: "this_year", label: "This Year" },
]

export default function DashboardPage() {
  const [range, setRange] = useState<string>("last_30_days")
  const bookingsQ  = useDashboardBookings()
  const revenueQ   = useDashboardRevenue(range)
  const activityQ  = useDashboardActivity()

  const bookings   = bookingsQ.data?.data  ?? []
  const revenue    = revenueQ.data
  const activity   = activityQ.data?.data  ?? []
  const chartData  = revenue?.chartData    ?? []

  const totalBookings = revenue?.totalBookings ?? bookingsQ.data?.meta?.total_count ?? 0
  const grossRevenue  = revenue?.totals?.gross ?? 0
  const activeAgents  = revenue?.activeAgents ?? 0
  const chargebackAndRefund = (revenue?.totals?.chargebacks ?? 0) + (revenue?.totals?.refunds ?? 0)
  const topPerformers    = revenue?.topPerformers ?? []
  const bottomPerformers = revenue?.bottomPerformers ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Overview"
        actions={
          <div className="flex gap-1.5">
            {RANGE_PRESETS.map(p => (
              <button key={p.value} onClick={() => setRange(p.value)}
                className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  range === p.value ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}>
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Total Bookings" value={String(totalBookings)}
          icon={BookOpen} iconColor="text-blue-600"
          isLoading={revenueQ.isLoading} />
        <MetricCard label="Active Agents" value={String(activeAgents)}
          icon={Users2} iconColor="text-green-600"
          isLoading={revenueQ.isLoading} />
        <MetricCard label="Revenue" value={formatCurrency(grossRevenue, "USD")}
          icon={DollarSign} iconColor="text-primary"
          isLoading={revenueQ.isLoading} />
        <MetricCard label="Chargeback + Refund" value={formatCurrency(chargebackAndRefund, "USD")}
          icon={AlertTriangle} iconColor="text-red-500"
          isLoading={revenueQ.isLoading} />
      </div>

      {/* Top/Bottom Performers */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Trophy className="h-4 w-4 text-primary" /> Top Performers
            </h2>
            <span className="text-xs text-slate-400">$ MCO</span>
          </div>
          {revenueQ.isLoading ? <Skeleton className="h-32 w-full" /> : topPerformers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map(p => (
                <div key={p.agentId} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">{p.name}</span>
                      <Badge variant="success">Top Performer</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">MCO Revenue: {formatCurrency(p.mcoRevenue, "USD")}</p>
                  </div>
                  <span className="text-sm text-slate-500">{p.totalBookings} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <TrendingDownIcon className="h-4 w-4 text-red-500" /> Bottom Performers
            </h2>
            <span className="text-xs text-slate-400">$ MCO</span>
          </div>
          {revenueQ.isLoading ? <Skeleton className="h-32 w-full" /> : bottomPerformers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {bottomPerformers.map(p => (
                <div key={p.agentId} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 text-sm">{p.name}</span>
                      <Badge variant="default">Bottom Performer</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">MCO Revenue: {formatCurrency(p.mcoRevenue, "USD")}</p>
                  </div>
                  <span className="text-sm text-slate-500">{p.totalBookings} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Revenue – Last 30 Days</h2>
          {revenueQ.isLoading ? (
            <Skeleton className="h-60 w-full" />
          ) : revenueQ.isError ? (
            <ErrorState description="Failed to load revenue chart" onRetry={() => revenueQ.refetch()} />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false}
                  tickFormatter={v => v.slice(5)} interval={4} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false}
                  tickFormatter={v => "$" + (v / 100000).toFixed(0) + "k"} />
                <Tooltip formatter={(v: number) => [formatCurrency(v, "USD"), "Gross"]}
                  contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12 }} />
                <Area type="monotone" dataKey="gross" stroke="#2563EB" strokeWidth={2}
                  fill="url(#gBlue)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <Link to="/activity" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <ActivityTimeline events={activity} isLoading={activityQ.isLoading} compact />
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
          <Link to="/bookings" className="text-xs text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          {bookingsQ.isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : bookingsQ.isError ? (
            <ErrorState description="Could not load bookings" onRetry={() => bookingsQ.refetch()} className="py-8" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Reference","Passenger","Airline","Status","Amount","Date"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => {
                  const p = b.passengers?.[0]
                  const total = (b.charges ?? []).reduce((s, c) => s + c.amount, 0)
                  return (
                  <tr key={b.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/bookings/${b.id}`} className="font-mono text-xs text-blue-600 hover:underline">{b.reference}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-900">{p ? `${p.firstName} ${p.lastName}` : "—"}</td>
                    <td className="px-4 py-3 text-slate-500">{b.segments?.[0]?.airline?.airlineName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={BOOKING_STATUS_COLORS[b.status] as BadgeProps["variant"]} dot>
                        {BOOKING_STATUS_LABELS[b.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 tabular-nums">
                      {formatCurrency(total, b.charges?.[0]?.currency?.code ?? "USD")}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(b.createdAt)}</td>
                  </tr>
                  )
                })}
                {bookings.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No bookings yet</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
