import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Edit, Plane, User, Clock, StickyNote } from "lucide-react"
import { PageHeader }        from "@/components/app/PageHeader"
import { Button }            from "@/components/ui/Button"
import { Badge }             from "@/components/ui/Badge"
import { Skeleton }          from "@/components/ui/Skeleton"
import { ErrorState }        from "@/components/app/ErrorState"
import { ActivityTimeline }  from "@/components/app/ActivityTimeline"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { BookingNotesTab }   from "@/features/bookings/components/BookingNotesTab"
import { useBooking, useCancelBooking } from "@/features/bookings/hooks/useBookings"
import { useActivity }       from "@/features/activity/hooks/useActivity"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/config/constants"
import { usePermission }     from "@/hooks/usePermission"
import type { BadgeProps }   from "@/components/ui/Badge"

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-slate-900">{value ?? "—"}</span>
    </div>
  )
}

export default function BookingDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const canEdit   = usePermission("bookings", "edit")

  const { data: booking, isLoading, isError, refetch } = useBooking(id!)
  const { data: activityData, isLoading: loadingActivity } = useActivity({ limit: 10 })
  const cancelBooking = useCancelBooking()

  if (isLoading) return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <Skeleton className="h-48 w-full rounded-md" />
          <Skeleton className="h-36 w-full rounded-md" />
        </div>
        <Skeleton className="h-80 w-full rounded-md" />
      </div>
    </div>
  )

  if (isError || !booking) return (
    <ErrorState
      title="Booking not found"
      description="This booking may have been deleted or you may not have access."
      onRetry={refetch}
    />
  )

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={booking.reference}
          subtitle={`PNR: ${booking.pnr}`}
          className="mb-0 flex-1"
          actions={
            <div className="flex gap-2">
              {canEdit && booking.status !== "CANCELLED" && booking.status !== "REFUNDED" && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => cancelBooking.mutate(booking.id)}
                  loading={cancelBooking.isPending}
                >
                  Cancel Booking
                </Button>
              )}
              {canEdit && (
                <Button
                  leftIcon={<Edit className="h-4 w-4" />}
                  onClick={() => navigate(`/bookings/${booking.id}/edit`)}
                >
                  Edit Booking
                </Button>
              )}
            </div>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left column ─────────────────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Booking Status</h2>
              <Badge variant={BOOKING_STATUS_COLORS[booking.status] as BadgeProps["variant"]} dot>
                {BOOKING_STATUS_LABELS[booking.status]}
              </Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Gross Amount"
                value={formatCurrency(booking.grossAmount, booking.currency?.code ?? "USD")} />
              <InfoRow label="Net Amount"
                value={formatCurrency(booking.netAmount, booking.currency?.code ?? "USD")} />
              <InfoRow label="Currency"     value={booking.currency?.code} />
              <InfoRow label="Travel Date"  value={formatDate(booking.travelDate)} />
              <InfoRow label="Return Date"
                value={booking.returnDate ? formatDate(booking.returnDate) : "One-way"} />
              <InfoRow label="Created"      value={formatDateTime(booking.createdAt)} />
            </div>
          </div>

          {/* Passenger */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" /> Passenger
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Name"  value={booking.passengerName} />
              <InfoRow label="Email" value={booking.passengerEmail} />
              <InfoRow label="Phone" value={booking.passengerPhone} />
            </div>
          </div>

          {/* Flight details */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Plane className="h-4 w-4 text-slate-400" /> Flight Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow
                label="Airline"
                value={
                  booking.airline ? (
                    <span>{booking.airline.airlineName}
                      <span className="ml-1 font-mono text-xs text-slate-400">
                        ({booking.airline.iataCode})
                      </span>
                    </span>
                  ) : "—"
                }
              />
              <InfoRow label="Class"
                value={booking.class ? `${booking.class.name} (${booking.class.code})` : "—"} />
              <InfoRow label="Provider"   value={booking.provider?.name} />
              <InfoRow label="Processor"  value={booking.cardProcessor?.name} />
              <InfoRow
                label="Assigned To"
                value={booking.assignedTo
                  ? `${booking.assignedTo.firstName} ${booking.assignedTo.lastName}`
                  : "Unassigned"}
              />
              <InfoRow
                label="Created By"
                value={booking.createdBy
                  ? `${booking.createdBy.firstName} ${booking.createdBy.lastName}`
                  : "—"}
              />
            </div>
          </div>

          {booking.notes && (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-500 mb-2">Booking Notes</h2>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {/* ── Tabbed section: Notes + Activity ────────────────────── */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <Tabs defaultValue="notes">
              <TabsList className="mb-4">
                <TabsTrigger value="notes" className="flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" />
                  Internal Notes
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Activity Log
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes">
                <BookingNotesTab bookingId={id!} />
              </TabsContent>

              <TabsContent value="activity">
                <ActivityTimeline
                  events={activityData?.data ?? []}
                  isLoading={loadingActivity}
                  compact
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* ── Right column: quick-reference card ──────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wide">
              Quick Reference
            </h2>
            <dl className="space-y-3">
              {[
                { label: "Reference",  value: booking.reference },
                { label: "PNR",        value: booking.pnr },
                { label: "Airline",    value: booking.airline?.airlineName },
                { label: "Status",     value: BOOKING_STATUS_LABELS[booking.status] },
                { label: "Gross",      value: formatCurrency(booking.grossAmount, booking.currency?.code) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2 text-sm">
                  <dt className="text-slate-500 shrink-0">{label}</dt>
                  <dd className="font-medium text-slate-900 text-right truncate">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
