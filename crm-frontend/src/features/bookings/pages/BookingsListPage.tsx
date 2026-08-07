import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Download } from "lucide-react"
import { PageHeader }        from "@/components/app/PageHeader"
import { Button }            from "@/components/ui/Button"
import { Badge }             from "@/components/ui/Badge"
import { ErrorState }        from "@/components/app/ErrorState"
import { DataTable }         from "@/components/app/DataTable/DataTable"
import { DataTableColumnHeader } from "@/components/app/DataTable/DataTableColumnHeader"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { useBookings, useBulkDeleteBookings } from "../hooks/useBookings"
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/config/constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { ColumnDef, SortingState, PaginationState } from "@tanstack/react-table"
import type { Booking } from "@/types/booking.types"
import type { BadgeProps } from "@/components/ui/Badge"

const columns: ColumnDef<Booking>[] = [
  { id: "reference", accessorKey: "reference", size: 160,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Reference" />,
    cell: ({ row }) => <span className="font-mono text-xs text-blue-600">{row.original.reference}</span> },
  { id: "passengerName", accessorKey: "passengerName", size: 180,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Passenger" />,
    cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.passengerName}</span> },
  { id: "airline", accessorFn: r => r.airline?.airlineName, size: 140,
    header: "Airline",
    cell: ({ row }) => <span className="text-slate-500">{row.original.airline?.airlineName ?? "—"}</span> },
  { id: "status", accessorKey: "status", size: 130,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <Badge variant={BOOKING_STATUS_COLORS[row.original.status] as BadgeProps["variant"]} dot>
        {BOOKING_STATUS_LABELS[row.original.status]}
      </Badge>
    ) },
  { id: "class", accessorFn: r => r.class?.name, size: 120,
    header: "Class",
    cell: ({ row }) => <span className="text-slate-500">{row.original.class?.name ?? "—"}</span> },
  { id: "grossAmount", accessorKey: "grossAmount", size: 130,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {formatCurrency(row.original.grossAmount, row.original.currency?.code ?? "USD")}
      </span>
    ) },
  { id: "travelDate", accessorKey: "travelDate", size: 120,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Travel Date" />,
    cell: ({ row }) => <span className="text-slate-400 text-xs">{formatDate(row.original.travelDate)}</span> },
  { id: "createdAt", accessorKey: "createdAt", size: 120,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => <span className="text-slate-400 text-xs">{formatDate(row.original.createdAt)}</span> },
]

export default function BookingsListPage() {
  const navigate   = useNavigate()
  const [search, setSearch]           = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [sorting, setSorting]         = useState<SortingState>([{ id: "createdAt", desc: true }])
  const [pagination, setPagination]   = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  const sortBy  = sorting[0]?.id
  const sortDir = sorting[0]?.desc ? "desc" : "asc"

  const { data, isLoading, isError, refetch } = useBookings({
    page:     pagination.pageIndex + 1,
    per_page: pagination.pageSize,
    sort_by:  sortBy,
    sort_dir: sortDir,
    ...(statusFilter !== "ALL" ? { status: statusFilter as any } : {}),
    ...(search ? { search } : {}),
  })

  const bulkDelete = useBulkDeleteBookings()

  if (isError) return <ErrorState title="Failed to load bookings" onRetry={refetch} />

  return (
    <div className="space-y-4">
      <PageHeader title="Bookings"
        subtitle={data ? `${data.meta.total_count.toLocaleString()} bookings` : "Loading…"}
        actions={
          <>
            <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>Export</Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => navigate("/bookings/new")}>
              New Booking
            </Button>
          </>
        } />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalCount={data?.meta.total_count ?? 0}
        isLoading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        sorting={sorting}
        onSortingChange={setSorting}
        searchPlaceholder="Search by passenger, reference, PNR…"
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPagination(p => ({ ...p, pageIndex: 0 })) }}
        filters={
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPagination(p => ({ ...p, pageIndex: 0 })) }}>
            <SelectTrigger className="h-9 w-36 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {Object.entries(BOOKING_STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        onRowClick={row => navigate(`/bookings/${row.id}`)}
        tableKey="bookings"
        bulkActions={[
          {
            label: "Delete selected",
            destructive: true,
            onClick: ids => bulkDelete.mutate(ids),
          },
        ]}
      />
    </div>
  )
}
