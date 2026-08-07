import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Search, Ticket, User as UserIcon, Plane } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Input"
import { searchService } from "@/services/search.service"
import { useDebounce } from "@/hooks/useDebounce"
import { BOOKING_STATUS_LABELS } from "@/config/constants"

interface Props { open: boolean; onClose: () => void }

export function GlobalSearchModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const debounced = useDebounce(query, 300)

  useEffect(() => { if (!open) setQuery("") }, [open])

  const { data, isFetching } = useQuery({
    queryKey: ["search", "global", debounced],
    queryFn:  () => searchService.global(debounced),
    enabled:  debounced.length >= 2,
  })

  const goTo = (path: string) => { onClose(); navigate(path) }

  const hasResults = data && (data.bookings.length || data.users.length || data.airlines.length)

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent size="lg" className="p-0 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <Input
            autoFocus
            placeholder="Search bookings, users, airlines…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-8 px-0"
          />
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.length > 0 && query.length < 2 && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Keep typing… (2+ characters)</p>
          )}
          {debounced.length >= 2 && isFetching && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">Searching…</p>
          )}
          {debounced.length >= 2 && !isFetching && !hasResults && (
            <p className="px-3 py-6 text-center text-sm text-slate-400">No results for &ldquo;{debounced}&rdquo;</p>
          )}

          {data && data.bookings.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">Bookings</p>
              {data.bookings.map(b => (
                <button key={b.id} onClick={() => goTo(`/bookings/${b.id}`)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                  <Ticket className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{b.reference}</span>
                  <span className="text-slate-500">{b.passengerName}</span>
                  <span className="ml-auto text-xs text-slate-400">{BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ?? b.status}</span>
                </button>
              ))}
            </div>
          )}

          {data && data.users.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">Users</p>
              {data.users.map(u => (
                <button key={u.id} onClick={() => goTo(`/users/${u.id}`)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                  <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{u.firstName} {u.lastName}</span>
                  <span className="text-slate-500">{u.email}</span>
                </button>
              ))}
            </div>
          )}

          {data && data.airlines.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">Airlines</p>
              {data.airlines.map(a => (
                <button key={a.id} onClick={() => goTo(`/manage/airlines`)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100">
                  <Plane className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-900">{a.airlineName}</span>
                  <span className="text-slate-500">{a.iataCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
