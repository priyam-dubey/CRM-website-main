import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Edit, Plane, User, Clock, StickyNote, ShieldCheck, Send, Mail, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useMutation } from "@tanstack/react-query"
import { PageHeader }        from "@/components/app/PageHeader"
import { Button }            from "@/components/ui/Button"
import { Badge }             from "@/components/ui/Badge"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/DropdownMenu"
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerTitle } from "@/components/ui/Drawer"
import { Skeleton }          from "@/components/ui/Skeleton"
import { ErrorState }        from "@/components/app/ErrorState"
import { ActivityTimeline }  from "@/components/app/ActivityTimeline"
import { BookingNotesTab }   from "@/features/bookings/components/BookingNotesTab"
import { useBooking, useCancelBooking } from "@/features/bookings/hooks/useBookings"
import { useActivity }       from "@/features/activity/hooks/useActivity"
import { bookingService }    from "@/services/booking.service"
import { getErrorMessage }   from "@/lib/api-client"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/config/constants"
import { usePermission }     from "@/hooks/usePermission"
import { PASSENGER_TYPE_LABELS } from "@/types/booking.types"
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
  const [remarksOpen, setRemarksOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)
  const sendVerification = useMutation({
    mutationFn: () => bookingService.sendVerification(id!),
    onSuccess: () => { toast.success("Verification email sent"); refetch() },
    onError:   (err) => toast.error(getErrorMessage(err)),
  })

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

  const chargesTotal = (booking.charges ?? []).reduce((s, c) => s + c.amount, 0)
  const primaryCurrencyCode = booking.charges?.[0]?.currency?.code ?? "USD"
  const firstSegment  = (booking.segments ?? []).find(s => s.direction === "OUTBOUND") ?? booking.segments?.[0]
  const returnSegment = (booking.segments ?? []).find(s => s.direction === "RETURN")

  // "Auth Status" relabels BookingVerification.status for the CRM UI —
  // VERIFIED reads as "Authorized" here to match the client's original CRM
  // terminology, without a schema/enum-value migration (see schema.prisma
  // comment on BookingVerification.status).
  const latestVerification = booking.verifications?.[0]
  const authStatusLabel: string =
    latestVerification?.status === "VERIFIED" ? "Authorized" :
    latestVerification?.status === "EXPIRED"  ? "Expired" :
    latestVerification ? "Pending" : "Not Sent"
  const authStatusVariant: BadgeProps["variant"] =
    latestVerification?.status === "VERIFIED" ? "success" :
    latestVerification?.status === "EXPIRED"  ? "error" : "warning"

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
              <Button variant="outline" size="sm" leftIcon={<StickyNote className="h-4 w-4" />} onClick={() => setRemarksOpen(true)}>
                Remarks
              </Button>
              <Button variant="outline" size="sm" leftIcon={<Clock className="h-4 w-4" />} onClick={() => setActivityOpen(true)}>
                Activity
              </Button>
              <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => refetch()}>
                Refresh
              </Button>
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
              {canEdit && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" leftIcon={<Mail className="h-4 w-4" />}>Email</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => sendVerification.mutate()}
                      disabled={!booking.customerEmail || sendVerification.isPending}
                    >
                      Auth
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast.info("Manual email composer isn't wired up yet.")}>
                      Send Manual Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canEdit && (
                <Button
                  variant="outline" size="sm"
                  onClick={() => toast.info("Create Revision isn't implemented yet — every booking currently supports exactly one transaction. See IMPLEMENTATION.md.")}
                >
                  Create Revision
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
              <div className="flex items-center gap-2">
                <Badge variant={BOOKING_STATUS_COLORS[booking.status] as BadgeProps["variant"]} dot>
                  Bid Status: {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
                <Badge variant={authStatusVariant} dot>
                  Auth Status: {authStatusLabel}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="BID"          value={booking.reference} />
              <InfoRow label="Total"
                value={formatCurrency(chargesTotal, primaryCurrencyCode)} />
              <InfoRow label="Currency"     value={primaryCurrencyCode} />
              <InfoRow label="Travel Date"  value={firstSegment?.departureAt ? formatDate(firstSegment.departureAt) : "—"} />
              <InfoRow label="Return"
                value={returnSegment?.departureAt ? formatDate(returnSegment.departureAt) : "One-way"} />
              <InfoRow label="Created"      value={formatDateTime(booking.createdAt)} />
            </div>
          </div>

          {/* Client Verification */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Client Verification
              </h2>
              {booking.verifications?.[0]?.status === "VERIFIED" ? (
                <Badge variant="success" dot>✓ Verified</Badge>
              ) : (
                <Badge variant="outline">Unverified</Badge>
              )}
            </div>
            {booking.verifications?.[0]?.status === "VERIFIED" ? (
              <p className="text-sm text-slate-500 mt-2">
                Verified at {formatDateTime(booking.verifications[0].verifiedAt!)} by{" "}
                {booking.verifications[0].clientEmail}
              </p>
            ) : (
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-slate-500">
                  {booking.verifications?.[0]?.status === "PENDING"
                    ? `Verification email sent to ${booking.verifications[0].clientEmail} — awaiting client response.`
                    : "Send the client an email to review and digitally sign this booking."}
                </p>
                {canEdit && (
                  <Button
                    variant="outline" size="sm"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    onClick={() => sendVerification.mutate()}
                    loading={sendVerification.isPending}
                    disabled={!booking.customerEmail}
                  >
                    {booking.verifications?.[0]?.status === "PENDING" ? "Resend" : "Send for Verification"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Passengers */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" /> Passengers
            </h2>
            <div className="space-y-3">
              {(booking.passengers ?? []).map(p => (
                <div key={p.id} className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <InfoRow label="Name" value={[p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ")} />
                  <InfoRow label="Type" value={PASSENGER_TYPE_LABELS[p.type]} />
                  <InfoRow label="DOB" value={p.dob ? formatDate(p.dob) : "—"} />
                  <InfoRow label="Ticket #" value={p.ticketNumber} />
                </div>
              ))}
              {!booking.passengers?.length && <p className="text-sm text-slate-400">No passengers on file.</p>}
              <InfoRow label="Customer Email" value={booking.customerEmail} />
            </div>
          </div>

          {/* Flight details */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Plane className="h-4 w-4 text-slate-400" /> Itinerary
            </h2>
            <div className="space-y-3">
              {(booking.segments ?? []).map(s => (
                <div key={s.id} className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  {s.itineraryType === "IMAGE" ? (
                    <>
                      <InfoRow label={s.direction === "OUTBOUND" ? "Outbound" : "Return"} value="Itinerary provided as image" />
                      <InfoRow label="Departure" value={formatDateTime(s.departureAt)} />
                      <InfoRow label="Arrival" value={formatDateTime(s.arrivalAt)} />
                      <div className="col-span-2 sm:col-span-3 flex flex-wrap gap-2">
                        {s.imageUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 underline break-all">
                            Itinerary image {i + 1}
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <InfoRow label={s.direction === "OUTBOUND" ? "Outbound" : "Return"}
                        value={s.airline ? `${s.airline.airlineName} (${s.airline.iataCode}) ${s.flightNumber}` : s.flightNumber} />
                      <InfoRow label="Route" value={`${s.fromText} → ${s.toText}`} />
                      <InfoRow label="Class" value={s.class ? `${s.class.name} (${s.class.code})` : "—"} />
                      <InfoRow label="Departure" value={formatDateTime(s.departureAt)} />
                      <InfoRow label="Arrival" value={formatDateTime(s.arrivalAt)} />
                      <InfoRow label="PNR/Confirmation" value={s.pnrConfirmation} />
                    </>
                  )}
                </div>
              ))}
              {!booking.segments?.length && <p className="text-sm text-slate-400">No itinerary on file.</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                <InfoRow label="Provider" value={booking.provider?.name} />
                <InfoRow label="Assigned To" value={booking.assignedTo ? `${booking.assignedTo.firstName} ${booking.assignedTo.lastName}` : "Unassigned"} />
                <InfoRow label="Created By" value={booking.createdBy ? `${booking.createdBy.firstName} ${booking.createdBy.lastName}` : "—"} />
              </div>
            </div>
          </div>

          {/* Billing */}
          {booking.billing && (
            <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Billing &amp; Payment</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Card Holder" value={booking.billing.cardHolderName} />
                <InfoRow label="Card" value={`${booking.billing.cardProcessor?.name ?? "Card"} •••• ${booking.billing.cardLast4}`} />
                <InfoRow label="Expiry" value={`${String(booking.billing.expiryMonth).padStart(2, "0")}/${booking.billing.expiryYear}`} />
                <InfoRow label="Billing Email" value={booking.billing.billingEmail} />
                <InfoRow label="Contact No." value={booking.billing.billingContactNo} />
                <InfoRow label="Purchase Date" value={formatDate(booking.billing.purchaseDate)} />
              </div>
            </div>
          )}

          {/* Charges */}
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Charges &amp; Fees</h2>
            <div className="space-y-2">
              {(booking.charges ?? []).map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">#{c.chargeNumber} {c.description ?? ""}</span>
                  <span className="font-medium tabular-nums">{formatCurrency(c.amount, c.currency?.code ?? "USD")}</span>
                </div>
              ))}
              {!booking.charges?.length && <p className="text-sm text-slate-400">No charges on file.</p>}
            </div>
          </div>

          {/* ── Notes + Activity now live in slide-in drawers (see top action bar) ── */}
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
                { label: "Airline",    value: firstSegment?.airline?.airlineName },
                { label: "Status",     value: BOOKING_STATUS_LABELS[booking.status] },
                { label: "Total",      value: formatCurrency(chargesTotal, primaryCurrencyCode) },
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

      <Drawer open={remarksOpen} onOpenChange={setRemarksOpen}>
        <DrawerContent className="w-full sm:w-[420px]">
          <DrawerHeader>
            <DrawerTitle>Remarks</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <BookingNotesTab bookingId={id!} />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Drawer open={activityOpen} onOpenChange={setActivityOpen}>
        <DrawerContent className="w-full sm:w-[420px]">
          <DrawerHeader>
            <DrawerTitle>Activity Log</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <ActivityTimeline events={activityData?.data ?? []} isLoading={loadingActivity} compact />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
