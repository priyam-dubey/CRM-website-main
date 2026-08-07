import { PageHeader }  from "@/components/app/PageHeader"
import { MetricCard }  from "@/components/app/MetricCard"
import { ErrorState }  from "@/components/app/ErrorState"
import { Skeleton }    from "@/components/ui/Skeleton"
import { formatCurrency } from "@/lib/utils"
import { DollarSign, TrendingDown, RefreshCw, AlertTriangle } from "lucide-react"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { useRevenueDashboard } from "../hooks/useRevenue"

export default function RevenueDashboardPage() {
  const { data, isLoading, isError, refetch } = useRevenueDashboard({ period: "month" })

  if (isError) return <ErrorState title="Failed to load revenue data" onRetry={refetch} />

  const totals   = data?.totals
  const chart    = data?.chartData ?? []

  return (
    <div className="space-y-6">
      <PageHeader title="Revenue" subtitle="Financial overview and analytics" />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label="Gross Revenue"  value={totals ? formatCurrency(totals.gross, "USD") : "—"}
          delta={8.2}  icon={DollarSign}    iconColor="text-green-600"  isLoading={isLoading} />
        <MetricCard label="Net Revenue"    value={totals ? formatCurrency(totals.net, "USD") : "—"}
          delta={6.1}  icon={TrendingDown}  iconColor="text-blue-600"   isLoading={isLoading} />
        <MetricCard label="Chargebacks"    value={totals ? formatCurrency(totals.chargebacks, "USD") : "—"}
          delta={-15}  icon={AlertTriangle} iconColor="text-red-500"    isLoading={isLoading} />
        <MetricCard label="Refunds"        value={totals ? formatCurrency(totals.refunds, "USD") : "—"}
          delta={2.3}  icon={RefreshCw}     iconColor="text-amber-500"  isLoading={isLoading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Gross vs Net Revenue</h2>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chart.slice(-14)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false}
                  tickFormatter={v => "$" + (v / 100000).toFixed(0) + "k"} />
                <Tooltip formatter={(v: number, n: string) => [formatCurrency(v, "USD"), n]}
                  contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="gross" name="Gross" stroke="#2563EB" strokeWidth={2} fill="url(#g1)" dot={false} />
                <Area type="monotone" dataKey="net"   name="Net"   stroke="#16A34A" strokeWidth={2} fill="url(#g2)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Chargebacks – Last 14 Days</h2>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chart.slice(-14)} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false}
                  tickFormatter={v => "$" + (v / 1000).toFixed(0) + "k"} />
                <Tooltip formatter={(v: number) => [formatCurrency(v, "USD"), "Chargebacks"]}
                  contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="chargebacks" name="Chargebacks" fill="#DC2626" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
