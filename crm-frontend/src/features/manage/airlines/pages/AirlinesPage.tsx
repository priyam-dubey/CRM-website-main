import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, Plane } from "lucide-react"
import { PageHeader }    from "@/components/app/PageHeader"
import { Button }        from "@/components/ui/Button"
import { Badge }         from "@/components/ui/Badge"
import { Input }         from "@/components/ui/Input"
import { FormField }     from "@/components/ui/FormField"
import { Skeleton }      from "@/components/ui/Skeleton"
import { ErrorState }    from "@/components/app/ErrorState"
import { EmptyState }    from "@/components/app/EmptyState"
import { ConfirmDialog, Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle } from "@/components/ui/Modal"
import { useAirlineList, useCreateAirline, useUpdateAirline, useToggleAirlineActive, useDeleteAirline } from "../hooks/useAirlines"
import { usePermission } from "@/hooks/usePermission"
import { useDebounce }   from "@/hooks/useDebounce"
import { formatDate }    from "@/lib/utils"
import type { Airline }  from "@/types/shared.types"

// ─── Schemas ─────────────────────────────────────────────────────────────
const airlineSchema = z.object({
  airlineName: z.string().min(2, "Required").max(200),
  iataCode:    z.string().min(2).max(3).regex(/^[A-Z0-9]{2,3}$/, "2-3 uppercase letters/digits"),
  icaoCode:    z.string().regex(/^[A-Z]{4}$/, "Must be 4 uppercase letters").optional().or(z.literal("")),
  country:     z.string().min(2, "Required").max(100),
  logoUrl:     z.string().url("Must be a valid URL").optional().or(z.literal("")),
})
type AirlineFormValues = z.infer<typeof airlineSchema>

// ─── Airline Form Dialog ──────────────────────────────────────────────────
function AirlineFormDialog({
  open, onClose, airline,
}: { open: boolean; onClose: () => void; airline?: Airline }) {
  const isEdit        = !!airline
  const createAirline = useCreateAirline()
  const updateAirline = useUpdateAirline(airline?.id ?? "")

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<AirlineFormValues>({
      resolver: zodResolver(airlineSchema),
      defaultValues: airline ? {
        airlineName: airline.airlineName,
        iataCode:    airline.iataCode,
        icaoCode:    airline.icaoCode ?? "",
        country:     airline.country,
        logoUrl:     airline.logoUrl ?? "",
      } : {},
    })

  const onSubmit = async (values: AirlineFormValues) => {
    const payload = {
      ...values,
      icaoCode: values.icaoCode || undefined,
      logoUrl:  values.logoUrl  || undefined,
    }
    if (isEdit) {
      await updateAirline.mutateAsync(payload)
    } else {
      await createAirline.mutateAsync(payload as any)
    }
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Airline" : "New Airline"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Airline Name" required error={errors.airlineName?.message} className="col-span-2">
                <Input placeholder="Emirates" {...register("airlineName")} error={!!errors.airlineName} />
              </FormField>
              <FormField label="IATA Code" required error={errors.iataCode?.message}
                hint="2-3 uppercase letters/digits (e.g. EK)">
                <Input placeholder="EK" className="uppercase"
                  {...register("iataCode", { setValueAs: v => v.toUpperCase() })} error={!!errors.iataCode} />
              </FormField>
              <FormField label="ICAO Code" error={errors.icaoCode?.message}
                hint="4 uppercase letters (optional)">
                <Input placeholder="OMDB" className="uppercase"
                  {...register("icaoCode", { setValueAs: v => v.toUpperCase() })} />
              </FormField>
              <FormField label="Country" required error={errors.country?.message} className="col-span-2">
                <Input placeholder="United Arab Emirates" {...register("country")} error={!!errors.country} />
              </FormField>
              <FormField label="Logo URL" error={errors.logoUrl?.message} className="col-span-2"
                hint="Optional — direct URL to airline logo image">
                <Input type="url" placeholder="https://..." {...register("logoUrl")} />
              </FormField>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={isSubmitting || createAirline.isPending || updateAirline.isPending}>
              {isEdit ? "Save Changes" : "Create Airline"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function AirlinesPage() {
  const canCreate = usePermission("manage", "create")
  const canEdit   = usePermission("manage", "edit")
  const canDelete = usePermission("manage", "delete")

  const [search, setSearch]       = useState("")
  const [page, setPage]           = useState(1)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Airline | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, isError, refetch } = useAirlineList({
    search:   debouncedSearch || undefined,
    page,
    per_page: 20,
    sort_by:  "airlineName",
    sort_dir: "asc",
  })

  const toggleActive = useToggleAirlineActive()
  const deleteAirline = useDeleteAirline()

  const airlines   = data?.data ?? []
  const totalPages = data?.meta.total_pages ?? 1

  if (isError) return <ErrorState title="Failed to load airlines" onRetry={refetch} />

  return (
    <div className="space-y-4">
      <PageHeader
        title="Airlines"
        subtitle={data ? `${data.meta.total_count} airlines` : "Loading…"}
        actions={
          canCreate && (
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => { setEditing(undefined); setShowForm(true) }}>
              New Airline
            </Button>
          )
        }
      />

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Input
            placeholder="Search by name, IATA, country…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            leftAddon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : airlines.length === 0 ? (
          <EmptyState icon={Plane} title="No airlines found"
            description={search ? `No results for "${search}"` : "Create your first airline to get started"}
            action={canCreate ? { label: "New Airline", onClick: () => setShowForm(true) } : undefined} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Airline","IATA","ICAO","Country","Status","Created","Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {airlines.map(airline => (
                <tr key={airline.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 transition-colors">
                  {/* Airline name + logo */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {airline.logoUrl ? (
                        <img src={airline.logoUrl} alt={airline.airlineName}
                          className="h-7 w-7 rounded object-contain bg-slate-100 p-0.5"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                      ) : (
                        <div className="h-7 w-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                          <Plane className="h-4 w-4 text-slate-400" />
                        </div>
                      )}
                      <span className="font-medium text-slate-900">{airline.airlineName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {airline.iataCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {airline.icaoCode ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{airline.country}</td>
                  <td className="px-4 py-3">
                    <Badge variant={airline.isActive ? "success" : "default"} dot>
                      {airline.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(airline.createdAt)}</td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon-sm" aria-label="Edit airline"
                            onClick={() => { setEditing(airline); setShowForm(true) }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm"
                            aria-label={airline.isActive ? "Deactivate" : "Activate"}
                            onClick={() => toggleActive.mutate({ id: airline.id, isActive: !airline.isActive })}>
                            {airline.isActive
                              ? <ToggleRight className="h-4 w-4 text-green-600" />
                              : <ToggleLeft  className="h-4 w-4 text-slate-400" />}
                          </Button>
                        </>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon-sm" aria-label="Delete airline"
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setDeletingId(airline.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      <AirlineFormDialog
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined) }}
        airline={editing}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => { if (deletingId) { deleteAirline.mutate(deletingId); setDeletingId(null) } }}
        title="Delete Airline"
        description="This airline will be soft-deleted and removed from booking dropdowns. Existing bookings are unaffected."
        confirmLabel="Delete"
        destructive
        loading={deleteAirline.isPending}
      />
    </div>
  )
}
