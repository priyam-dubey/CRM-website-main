import { useState, useRef } from "react"
import { Search, ChevronDown, Check, Plane } from "lucide-react"
import * as Popover from "@radix-ui/react-popover"
import { useAirlineList } from "@/features/manage/airlines/hooks/useAirlines"
import { useDebounce }    from "@/hooks/useDebounce"
import { cn }             from "@/lib/utils"
import type { Airline }   from "@/types/shared.types"

interface AirlineSelectProps {
  value:    string
  onChange: (id: string) => void
  error?:   boolean
  disabled?: boolean
}

export function AirlineSelect({ value, onChange, error, disabled }: AirlineSelectProps) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch     = useDebounce(search, 250)
  const inputRef            = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useAirlineList({
    search:   debouncedSearch || undefined,
    isActive: true,
    per_page: 50,
    sort_by:  "airlineName",
    sort_dir: "asc",
  })

  const airlines  = data?.data ?? []
  const selected  = airlines.find(a => a.id === value)

  const handleSelect = (airline: Airline) => {
    onChange(airline.id)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover.Root open={open} onOpenChange={v => {
      setOpen(v)
      if (v) setTimeout(() => inputRef.current?.focus(), 50)
    }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded border bg-white px-3 py-2",
            "text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
            "disabled:cursor-not-allowed disabled:bg-slate-50",
            error  ? "border-red-500 focus:ring-red-500" : "border-slate-200",
            !value && "text-slate-400",
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                  {selected.iataCode}
                </span>
                <span className="truncate">{selected.airlineName}</span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Plane className="h-3.5 w-3.5" />
                Search and select airline…
              </span>
            )}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-md border border-slate-200 bg-white shadow-lg overflow-hidden"
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or IATA code…"
              className="flex-1 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto py-1" role="listbox">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">Loading…</div>
            ) : airlines.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                {search ? `No results for "${search}"` : "No active airlines found"}
              </div>
            ) : (
              airlines.map(airline => (
                <button
                  key={airline.id}
                  type="button"
                  role="option"
                  aria-selected={airline.id === value}
                  onClick={() => handleSelect(airline)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors",
                    "hover:bg-slate-100 focus:bg-slate-100 focus:outline-none",
                    airline.id === value && "bg-blue-50",
                  )}
                >
                  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 w-9 text-center">
                    {airline.iataCode}
                  </span>
                  <span className="flex-1 truncate">{airline.airlineName}</span>
                  {airline.icaoCode && (
                    <span className="text-xs text-slate-400 shrink-0">{airline.icaoCode}</span>
                  )}
                  <span className="text-xs text-slate-400 shrink-0">{airline.country}</span>
                  {airline.id === value && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
