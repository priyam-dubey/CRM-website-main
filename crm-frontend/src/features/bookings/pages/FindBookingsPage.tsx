import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Ticket } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { EmptyState } from "@/components/app/EmptyState"
import { useBookings } from "../hooks/useBookings"
import { useDebounce } from "@/hooks/useDebounce"
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/config/constants"
import { TRANSACTION_TYPE_LABELS } from "@/types/booking.types"
import type { BookingSearchField } from "@/types/booking.types"
import { formatDate, formatTravelUrgency, cn } from "@/lib/utils"

const SEARCH_FIELDS: { value: BookingSearchField; label: string }[] = [
  { value: "reference",      label: "Booking ID" },
  { value: "passengerName",  label: "Passenger Name" },
  { value: "customerEmail",  label: "Customer Email" },
  { value: "pnr",            label: "PNR" },
]

export default function FindBookingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<"recent" | "urgent">("recent")
  const [searchField, setSearchField] = useState<BookingSearchField>("passengerName")
  const [search, setSearch] = useState("")
  const [perPage, setPerPage] = useState(100)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError } = useBookings({
    page, per_page: perPage,
    ...(tab === "urgent" ? { is_urgent: true } : {}),
    ...(debouncedSearch ? { search: debouncedSearch, search_field: searchField } : {}),
  })

  const bookings = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-4">
      <PageHeader title="Find Bookings" subtitle="Search across all bookings by booking ID, name, email, phone, or PNR" />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={searchField}
          onChange={e => setSearchField(e.target.value as BookingSearchField)}
          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
        >
          {SEARCH_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <Input
          placeholder={`Search booking by ${SEARCH_FIELDS.find(f => f.value === searchField)?.label.toUpperCase()}…`}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          leftAddon={<Search className="h-4 w-4" />}
          className="max-w-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setTab("recent"); setPage(1) }}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "recent" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}
        >
          Recent Bookings
        </button>
        <button
          onClick={() => { setTab("urgent"); setPage(1) }}
          className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
            tab === "urgent" ? "bg-primary text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}
        >
          Urgent Bookings
        </button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-600">Failed to load bookings.</div>
        ) : bookings.length === 0 ? (
          <EmptyState title="No bookings found" description="Try a different search term or field." />
        ) : (
          <>
            <div className="divide-y divide-slate-200">
              {bookings.map(b => {
                const latestTxn = b.transactions?.[0]
                return (
                  <button
                    key={b.id}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{b.reference}</p>
                        <p className="text-xs text-slate-500">PNR: {b.pnr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Initial</Badge>
                      <Badge variant={BOOKING_STATUS_COLORS[b.status] as any} dot>
                        {BOOKING_STATUS_LABELS[b.status]}
                      </Badge>
                      {latestTxn && (
                        <Badge variant="info">{TRANSACTION_TYPE_LABELS[latestTxn.transactionType]}</Badge>
                      )}
                      {tab === "urgent" && b.segments?.[0] && (
                        <span className="flex flex-col items-end leading-tight ml-1">
                          <span className="text-xs font-medium text-slate-700">
                            Travel Date: {formatDate(b.segments[0].departureAt)}
                          </span>
                          <Badge variant="warning">{formatTravelUrgency(b.segments[0].departureAt)}</Badge>
                        </span>
                      )}
                      <span className="text-xs text-slate-400 ml-2">
                        Created by: {b.createdBy ? `${b.createdBy.firstName} ${b.createdBy.lastName}` : "—"}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {meta && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-500">
                <span>Showing {(meta.page - 1) * meta.per_page + 1} to {Math.min(meta.page * meta.per_page, meta.total_count)} of {meta.total_count} records</span>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <span>{page}</span>
                  <Button variant="outline" size="sm" disabled={page * perPage >= meta.total_count} onClick={() => setPage(p => p + 1)}>Next</Button>
                  <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1) }}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm">
                    {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
