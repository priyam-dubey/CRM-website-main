import { useParams } from "react-router-dom"
import { CheckCircle2, ShieldCheck, AlertCircle, Clock } from "lucide-react"
import axios from "axios"
import { Button } from "@/components/ui/Button"
import { useResolveVerificationToken, useSubmitVerification } from "../hooks/useBookingVerification"
import { getErrorMessage } from "@/lib/api-client"
import { Logo } from "@/components/app/Logo"

// Deliberately minimal: the client's own "Itinerary Authorization" email
// already contains the full passenger/flight/card/charges review — this
// landing page's only job is the single "I Authorize" click, matching the
// client's screenshots exactly. It's a real button/POST rather than the raw
// email link auto-authorizing on open, because corporate email security
// scanners routinely pre-fetch links, which would otherwise silently
// authorize real bookings before a human ever saw the email.
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Logo heightClassName="h-10" className="mx-auto" />
        </div>
        {children}
      </div>
    </div>
  )
}

export default function VerifyBookingPage() {
  const { token } = useParams<{ token: string }>()
  const { data, isLoading, isError, error } = useResolveVerificationToken(token)
  const submit = useSubmitVerification(token)

  if (isLoading) {
    return (
      <PageShell>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
          Loading…
        </div>
      </PageShell>
    )
  }

  if (isError) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    const expired = status === 410
    return (
      <PageShell>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
          {expired ? <Clock className="h-10 w-10 text-amber-500 mx-auto mb-3" /> : <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />}
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            {expired ? "Authorization link expired" : "Authorization link invalid"}
          </h2>
          <p className="text-sm text-slate-500">{getErrorMessage(error)}</p>
        </div>
      </PageShell>
    )
  }

  if (!data) return null

  if (data.status === "VERIFIED" || submit.isSuccess) {
    const verifiedAt = submit.data?.verifiedAt ?? data.verifiedAt
    return (
      <PageShell>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-slate-900 mb-1">Booking authorized</h2>
          <p className="text-sm text-slate-500">
            Thank you — booking {data.snapshot.reference} has been authorized
            {verifiedAt ? ` on ${new Date(verifiedAt).toLocaleString()}` : ""}.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center space-y-4">
        <ShieldCheck className="h-10 w-10 text-blue-600 mx-auto" />
        <div>
          <h2 className="text-base font-semibold text-slate-900">Authorize booking {data.snapshot.reference}</h2>
          <p className="text-sm text-slate-500 mt-1">
            Please make sure you've reviewed the full booking details in the email before authorizing.
          </p>
        </div>
        {submit.isError && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {getErrorMessage(submit.error)}
          </p>
        )}
        <Button className="w-full" onClick={() => submit.mutate()} loading={submit.isPending}>
          I Authorize
        </Button>
      </div>
    </PageShell>
  )
}
