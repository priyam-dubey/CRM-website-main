import { useEffect } from "react"
import { useForm }   from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router-dom"
import { z }            from "zod"
import { ArrowLeft }    from "lucide-react"
import { PageHeader }   from "@/components/app/PageHeader"
import { Button }       from "@/components/ui/Button"
import { Input }        from "@/components/ui/Input"
import { FormField }    from "@/components/ui/FormField"
import { Skeleton }     from "@/components/ui/Skeleton"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { useCreateBooking, useUpdateBooking, useBooking } from "../hooks/useBookings"
import { useBookingClasses, useProviders, useCardProcessors, useCurrencies } from "@/hooks/useReferenceData"
import { AirlineSelect } from "@/features/manage/airlines/components/AirlineSelect"
import { BOOKING_STATUS_LABELS } from "@/config/constants"

const schema = z.object({
  passengerName:   z.string().min(2, "Required"),
  passengerEmail:  z.string().email("Invalid email").optional().or(z.literal("")),
  passengerPhone:  z.string().optional(),
  pnr:             z.string().min(5, "Required").max(20),
  status:          z.string().min(1),
  airlineId:       z.string().uuid("Required"),
  classId:         z.string().uuid("Required"),
  providerId:      z.string().uuid("Required"),
  cardProcessorId: z.string().uuid("Required"),
  currencyId:      z.string().uuid("Required"),
  grossAmount:     z.number({ invalid_type_error: "Must be a number" }).int().positive("Must be positive"),
  travelDate:      z.string().min(1, "Required"),
  returnDate:      z.string().optional(),
  notes:           z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export default function BookingFormPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const isEdit     = !!id

  const { data: existing, isLoading: loadingExisting } = useBooking(id ?? "")
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking(id ?? "")

  const { data: classesData }    = useBookingClasses()
  const { data: providersData }  = useProviders()
  const { data: processorsData } = useCardProcessors()
  const { data: currenciesData } = useCurrencies()

  const classes    = classesData?.data    ?? []
  const providers  = providersData?.data  ?? []
  const processors = processorsData?.data ?? []
  const currencies = currenciesData?.data ?? []

  const { register, handleSubmit, setValue, watch, reset,
          formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "PENDING" },
  })

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        passengerName:   existing.passengerName,
        passengerEmail:  existing.passengerEmail ?? "",
        passengerPhone:  existing.passengerPhone ?? "",
        pnr:             existing.pnr,
        status:          existing.status,
        airlineId:       existing.airlineId,
        classId:         existing.classId,
        providerId:      existing.providerId,
        cardProcessorId: existing.cardProcessorId,
        currencyId:      existing.currencyId,
        grossAmount:     Math.round(existing.grossAmount / 100),
        travelDate:      existing.travelDate.split("T")[0],
        returnDate:      existing.returnDate?.split("T")[0] ?? "",
        notes:           existing.notes ?? "",
      })
    }
  }, [existing, isEdit, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, grossAmount: values.grossAmount * 100 }
    if (isEdit) {
      await updateBooking.mutateAsync(payload)
    } else {
      await createBooking.mutateAsync(payload)
    }
    navigate("/bookings")
  }

  if (isEdit && loadingExisting) return (
    <div className="space-y-4 max-w-3xl">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <PageHeader title={isEdit ? "Edit Booking" : "New Booking"} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Passenger */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Passenger Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" required error={errors.passengerName?.message}>
              <Input placeholder="John Smith" {...register("passengerName")} error={!!errors.passengerName} />
            </FormField>
            <FormField label="PNR" required error={errors.pnr?.message}>
              <Input placeholder="ABC123" {...register("pnr")} error={!!errors.pnr} />
            </FormField>
            <FormField label="Email" error={errors.passengerEmail?.message}>
              <Input type="email" placeholder="pax@email.com" {...register("passengerEmail")} />
            </FormField>
            <FormField label="Phone">
              <Input placeholder="+1 555 000 0000" {...register("passengerPhone")} />
            </FormField>
          </div>
        </div>

        {/* Flight */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Flight Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Status" required error={errors.status?.message}>
              <Select onValueChange={v => setValue("status", v)} defaultValue={watch("status")}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BOOKING_STATUS_LABELS).map(([v,l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Airline" required error={errors.airlineId?.message}>
              <AirlineSelect
                value={watch("airlineId") ?? ""}
                onChange={v => setValue("airlineId", v)}
                error={!!errors.airlineId}
              />
            </FormField>
            <FormField label="Class" required error={errors.classId?.message}>
              <Select onValueChange={v => setValue("classId", v)} defaultValue={watch("classId")}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Provider" required error={errors.providerId?.message}>
              <Select onValueChange={v => setValue("providerId", v)} defaultValue={watch("providerId")}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Card Processor" required error={errors.cardProcessorId?.message}>
              <Select onValueChange={v => setValue("cardProcessorId", v)} defaultValue={watch("cardProcessorId")}>
                <SelectTrigger><SelectValue placeholder="Select processor" /></SelectTrigger>
                <SelectContent>
                  {processors.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Travel Date" required error={errors.travelDate?.message}>
              <Input type="date" {...register("travelDate")} error={!!errors.travelDate} />
            </FormField>
            <FormField label="Return Date">
              <Input type="date" {...register("returnDate")} />
            </FormField>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Financial</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Gross Amount (in full currency units)" required error={errors.grossAmount?.message}
              hint="Enter in whole units e.g. 500 for $500.00">
              <Input type="number" step="1" min="1" placeholder="500"
                {...register("grossAmount", { valueAsNumber: true })} error={!!errors.grossAmount} />
            </FormField>
            <FormField label="Currency" required error={errors.currencyId?.message}>
              <Select onValueChange={v => setValue("currencyId", v)} defaultValue={watch("currencyId")}>
                <SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger>
                <SelectContent>
                  {currencies.map(c => <SelectItem key={c.id} value={c.id}>{c.code} – {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
          <FormField label="Notes">
            <textarea className="w-full rounded border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3} placeholder="Optional notes…" {...register("notes")} />
          </FormField>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={isSubmitting || createBooking.isPending || updateBooking.isPending}>
            {isEdit ? "Update Booking" : "Create Booking"}
          </Button>
        </div>
      </form>
    </div>
  )
}
