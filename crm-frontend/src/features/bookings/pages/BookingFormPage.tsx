import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Plus, Trash2, Save } from "lucide-react"
import { PageHeader } from "@/components/app/PageHeader"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { FormField } from "@/components/ui/FormField"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/Select"
import { AirlineSelect } from "@/features/manage/airlines/components/AirlineSelect"
import { useCreateBooking } from "../hooks/useBookings"
import { useBookingClasses, useProviders, useCardProcessors, useCurrencies, useCallQueues } from "@/hooks/useReferenceData"
import { cn } from "@/lib/utils"
import {
  TRANSACTION_TYPE_LABELS, TRANSACTION_TYPE_DESCRIPTIONS, PASSENGER_TYPE_LABELS,
  type TransactionType, type ChargeInput, type ItinerarySegmentInput, type PassengerInput,
  type AttachmentInput, type PassengerType, type CreateBookingInput,
} from "@/types/booking.types"

const SECTIONS = [
  { key: "charges",    label: "Charges & Fees",   hint: "Payment amounts, currency, and charge breakdown" },
  { key: "basic",      label: "Basic Details",    hint: "Transaction type, airline, PNR, and customer information" },
  { key: "itinerary",  label: "Itinerary Details",hint: "Flight information and travel itinerary" },
  { key: "passengers", label: "Passenger Details",hint: "Traveler information and passenger data" },
  { key: "billing",    label: "Billing & Payment",hint: "Payment method, card details, and billing address" },
  { key: "special",    label: "Special Details",  hint: "Transaction-specific fields and configurations" },
  { key: "attachments",label: "Attachments",      hint: "Supporting documents and files" },
] as const
type SectionKey = typeof SECTIONS[number]["key"]

let idSeq = 0
const nextId = () => `tmp-${++idSeq}`

export default function BookingFormPage() {
  const navigate = useNavigate()
  const createBooking = useCreateBooking()

  const { data: classesData }    = useBookingClasses()
  const { data: providersData }  = useProviders()
  const { data: processorsData } = useCardProcessors()
  const { data: currenciesData } = useCurrencies()
  const { data: callQueuesData } = useCallQueues()
  const classes    = classesData?.data    ?? []
  const providers  = providersData?.data  ?? []
  const processors = processorsData?.data ?? []
  const currencies = currenciesData?.data ?? []
  const callQueues = callQueuesData?.data ?? []

  // ── Pre-wizard: "Create New Transaction" ──
  const [started, setStarted] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>("NEW_BOOKING")
  const [customerEmail, setCustomerEmail] = useState("")
  const [providerId, setProviderId] = useState("")
  const [callQueueId, setCallQueueId] = useState("")

  // ── Wizard state ──
  const [section, setSection] = useState<SectionKey>("charges")
  const [completed, setCompleted] = useState<Set<SectionKey>>(new Set())

  const [charges, setCharges] = useState<(ChargeInput & { id: string })[]>([
    { id: nextId(), chargeNumber: 1, amount: 0, currencyId: "", description: "" },
  ])
  const [pnr, setPnr] = useState("")
  const [segments, setSegments] = useState<(ItinerarySegmentInput & { id: string })[]>([
    { id: nextId(), direction: "OUTBOUND", segmentNumber: 1, airlineId: "", flightNumber: "", fromText: "", toText: "", departureAt: "", arrivalAt: "", classId: "", pnrConfirmation: "" },
  ])
  const [passengers, setPassengers] = useState<(PassengerInput & { id: string })[]>([
    { id: nextId(), passengerNumber: 1, type: "ADULT", firstName: "", middleName: "", lastName: "", dob: "", ticketNumber: "" },
  ])
  const [billing, setBilling] = useState({
    cardHolderName: "", cardProcessorId: "", cardNumber: "", expiryMonth: "", expiryYear: "",
    billingEmail: "", billingContactNo: "", billingStreet: "", billingCity: "", billingState: "", billingZip: "", billingCountry: "",
  })
  const [attachments, setAttachments] = useState<AttachmentInput[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const totalAmount = charges.reduce((s, c) => s + (c.amount || 0), 0)
  const totalCurrency = currencies.find(c => c.id === charges[0]?.currencyId)

  function validateSection(key: SectionKey): string[] {
    const errs: string[] = []
    if (key === "charges") {
      if (!charges.length) errs.push("Add at least one charge.")
      charges.forEach((c, i) => {
        if (!c.currencyId) errs.push(`Charge #${i + 1}: currency is required.`)
        if (!c.amount || c.amount <= 0) errs.push(`Charge #${i + 1}: amount must be greater than 0.`)
      })
    }
    if (key === "basic") {
      if (!pnr.trim()) errs.push("Reservation confirmation number is required.")
    }
    if (key === "itinerary") {
      if (!segments.length) errs.push("Add at least one flight.")
      segments.forEach((s, i) => {
        if (!s.airlineId) errs.push(`Flight #${i + 1}: airline is required.`)
        if (!s.flightNumber?.trim()) errs.push(`Flight #${i + 1}: flight number is required.`)
        if (!s.fromText?.trim() || !s.toText?.trim()) errs.push(`Flight #${i + 1}: From and To are required.`)
        if (!s.departureAt || !s.arrivalAt) errs.push(`Flight #${i + 1}: departure and arrival are required.`)
        if (!s.classId) errs.push(`Flight #${i + 1}: class is required.`)
      })
    }
    if (key === "passengers") {
      if (!passengers.length) errs.push("Add at least one passenger.")
      passengers.forEach((p, i) => {
        if (!p.firstName?.trim() || !p.lastName?.trim()) errs.push(`Passenger #${i + 1}: first and last name are required.`)
      })
    }
    if (key === "billing") {
      if (!billing.cardHolderName.trim()) errs.push("Card holder name is required.")
      if (!billing.cardProcessorId) errs.push("Card type is required.")
      if (!/^\d{12,19}$/.test(billing.cardNumber.replace(/\s/g, ""))) errs.push("Card number must be 12–19 digits.")
      if (!billing.expiryMonth || !billing.expiryYear) errs.push("Expiry date is required.")
      if (!billing.billingEmail.trim()) errs.push("Email is required.")
      if (!billing.billingContactNo.trim()) errs.push("Contact number is required.")
    }
    return errs
  }

  function goTo(key: SectionKey) { setErrors([]); setSection(key) }

  function next() {
    const errs = validateSection(section)
    if (errs.length) { setErrors(errs); return }
    setCompleted(prev => new Set(prev).add(section))
    setErrors([])
    const idx = SECTIONS.findIndex(s => s.key === section)
    if (idx < SECTIONS.length - 1) setSection(SECTIONS[idx + 1].key)
  }
  function previous() {
    setErrors([])
    const idx = SECTIONS.findIndex(s => s.key === section)
    if (idx > 0) setSection(SECTIONS[idx - 1].key)
  }

  async function handleCreate() {
    const errs = validateSection("billing")
    if (errs.length) { setErrors(errs); return }

    // Card number is truncated to last-4 right here, client-side, and never
    // included in the submitted payload — see BillingInputDto on the backend
    // for why (PCI-DSS: full PAN and CVV must never reach the server).
    const cardLast4 = billing.cardNumber.replace(/\s/g, "").slice(-4)

    const payload: CreateBookingInput = {
      providerId, callQueueId: callQueueId || undefined, customerEmail,
      pnr: pnr || undefined, transactionType,
      charges: charges.map(({ id, ...c }) => c),
      segments: segments.map(({ id, ...s }) => ({ ...s, pnrConfirmation: s.pnrConfirmation || undefined })),
      passengers: passengers.map(({ id, ...p }) => ({
        ...p, middleName: p.middleName || undefined, dob: p.dob || undefined, ticketNumber: p.ticketNumber || undefined,
      })),
      billing: {
        cardHolderName: billing.cardHolderName, cardProcessorId: billing.cardProcessorId, cardLast4,
        expiryMonth: Number(billing.expiryMonth), expiryYear: Number(billing.expiryYear),
        billingEmail: billing.billingEmail, billingContactNo: billing.billingContactNo,
        billingStreet: billing.billingStreet || undefined, billingCity: billing.billingCity || undefined,
        billingState: billing.billingState || undefined, billingZip: billing.billingZip || undefined,
        billingCountry: billing.billingCountry || undefined,
      },
      attachments: attachments.length ? attachments : undefined,
    }

    try {
      const created = await createBooking.mutateAsync(payload)
      navigate(`/bookings/${created.id}`)
    } catch {
      // useCreateBooking already toasts the error
    }
  }

  // ── Pre-wizard screen ──
  if (!started) {
    return (
      <div className="max-w-xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Create New Transaction</h1>
          <p className="text-sm text-slate-500">Set up your transaction details</p>
        </div>
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6 space-y-5">
          <FormField label="Select Transaction Type">
            <Select value={transactionType} onValueChange={v => setTransactionType(v as TransactionType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l} — {TRANSACTION_TYPE_DESCRIPTIONS[v as TransactionType]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Customer Email" required>
            <Input type="email" placeholder="customer@example.com" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Provider" required>
              <Select value={providerId} onValueChange={setProviderId}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Call Queue">
              <Select value={callQueueId} onValueChange={setCallQueueId}>
                <SelectTrigger><SelectValue placeholder="Select call queue" /></SelectTrigger>
                <SelectContent>{callQueues.map(q => <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>)}</SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end">
            <Button
              disabled={!customerEmail || !providerId}
              onClick={() => setStarted(true)}
              rightIcon={<ChevronRight className="h-4 w-4" />}
            >
              Continue with {TRANSACTION_TYPE_LABELS[transactionType]}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isLastSection = section === "attachments"

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setStarted(false)}><ArrowLeft className="h-4 w-4" /></Button>
        <PageHeader title="Create New Booking" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: Form Sections */}
        <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 h-fit">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Form Sections</h3>
          <div className="space-y-1">
            {SECTIONS.map(s => (
              <button
                key={s.key} type="button" onClick={() => goTo(s.key)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  section === s.key ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50 text-slate-700",
                )}
              >
                <span className="flex items-center justify-between">
                  {s.label}
                  {completed.has(s.key) && <Check className="h-3.5 w-3.5 text-green-600" />}
                </span>
                <span className="block text-xs text-slate-400 mt-0.5">{s.hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span><span>{completed.size}/{SECTIONS.length}</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: `${(completed.size / SECTIONS.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-900">{SECTIONS.find(s => s.key === section)!.label}</h2>
            <p className="text-sm text-slate-500 mb-5">{SECTIONS.find(s => s.key === section)!.hint}</p>

            {section === "charges" && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setCharges(c => [...c, { id: nextId(), chargeNumber: c.length + 1, amount: 0, currencyId: "", description: "" }])}>
                    Add Charge
                  </Button>
                </div>
                {charges.map((c, i) => (
                  <div key={c.id} className="grid grid-cols-[1fr_140px_1fr_auto] gap-3 items-end">
                    <FormField label={i === 0 ? "Amount" : undefined}>
                      <Input type="number" min="0" step="0.01" value={c.amount || ""} onChange={e => setCharges(cs => cs.map(x => x.id === c.id ? { ...x, amount: Math.round(Number(e.target.value) * 100) } : x))} />
                    </FormField>
                    <FormField label={i === 0 ? "Currency" : undefined}>
                      <Select value={c.currencyId} onValueChange={v => setCharges(cs => cs.map(x => x.id === c.id ? { ...x, currencyId: v } : x))}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{currencies.map(cur => <SelectItem key={cur.id} value={cur.id}>{cur.code}</SelectItem>)}</SelectContent>
                      </Select>
                    </FormField>
                    <FormField label={i === 0 ? "Description" : undefined}>
                      <Input placeholder="Description" value={c.description ?? ""} onChange={e => setCharges(cs => cs.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))} />
                    </FormField>
                    {charges.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setCharges(cs => cs.filter(x => x.id !== c.id).map((x, idx) => ({ ...x, chargeNumber: idx + 1 })))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section === "basic" && (
              <div className="space-y-4 max-w-md">
                <FormField label="Reservation Confirmation Number" required>
                  <Input placeholder="000001" value={pnr} onChange={e => setPnr(e.target.value)} />
                </FormField>
                <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
                  Dear {passengers[0]?.firstName || "Customer"}, thank you for contacting us! As per our conversation and as agreed,
                  we have booked your reservation under Confirmation number <b>{pnr || "—"}</b> with a charge of{" "}
                  <b>{(totalAmount / 100).toFixed(2)} {totalCurrency?.code ?? ""}</b> (Including all taxes and fees) as per the description.
                </p>
              </div>
            )}

            {section === "itinerary" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setSegments(s => [...s, { id: nextId(), direction: "OUTBOUND", segmentNumber: s.length + 1, airlineId: "", flightNumber: "", fromText: "", toText: "", departureAt: "", arrivalAt: "", classId: "", pnrConfirmation: "" }])}>
                    Add Flight
                  </Button>
                </div>
                {segments.map(s => (
                  <div key={s.id} className="border border-slate-200 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Select value={s.direction} onValueChange={v => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, direction: v as "OUTBOUND" | "RETURN" } : x))}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="OUTBOUND">Outbound</SelectItem><SelectItem value="RETURN">Return</SelectItem></SelectContent>
                      </Select>
                      {segments.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => setSegments(ss => ss.filter(x => x.id !== s.id))}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Airline"><AirlineSelect value={s.airlineId} onChange={v => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, airlineId: v } : x))} /></FormField>
                      <FormField label="Flight Number"><Input value={s.flightNumber} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, flightNumber: e.target.value } : x))} /></FormField>
                      <FormField label="From"><Input value={s.fromText} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, fromText: e.target.value } : x))} /></FormField>
                      <FormField label="To"><Input value={s.toText} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, toText: e.target.value } : x))} /></FormField>
                      <FormField label="Departure"><Input type="datetime-local" value={s.departureAt} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, departureAt: e.target.value } : x))} /></FormField>
                      <FormField label="Arrival"><Input type="datetime-local" value={s.arrivalAt} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, arrivalAt: e.target.value } : x))} /></FormField>
                      <FormField label="Class">
                        <Select value={s.classId} onValueChange={v => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, classId: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                      </FormField>
                      <FormField label="PNR/Confirmation"><Input value={s.pnrConfirmation ?? ""} onChange={e => setSegments(ss => ss.map(x => x.id === s.id ? { ...x, pnrConfirmation: e.target.value } : x))} /></FormField>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {section === "passengers" && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />}
                    onClick={() => setPassengers(p => [...p, { id: nextId(), passengerNumber: p.length + 1, type: "ADULT", firstName: "", middleName: "", lastName: "", dob: "", ticketNumber: "" }])}>
                    Add Passenger
                  </Button>
                </div>
                {passengers.map(p => (
                  <div key={p.id} className="grid grid-cols-[130px_1fr_1fr_1fr_140px_1fr_auto] gap-3 items-end">
                    <Select value={p.type} onValueChange={v => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, type: v as PassengerType } : x))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(PASSENGER_TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input placeholder="First Name" value={p.firstName} onChange={e => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, firstName: e.target.value } : x))} />
                    <Input placeholder="Middle Name" value={p.middleName ?? ""} onChange={e => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, middleName: e.target.value } : x))} />
                    <Input placeholder="Last Name" value={p.lastName} onChange={e => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, lastName: e.target.value } : x))} />
                    <Input type="date" value={p.dob ?? ""} onChange={e => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, dob: e.target.value } : x))} />
                    <Input placeholder="Ticket Number" value={p.ticketNumber ?? ""} onChange={e => setPassengers(ps => ps.map(x => x.id === p.id ? { ...x, ticketNumber: e.target.value } : x))} />
                    {passengers.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => setPassengers(ps => ps.filter(x => x.id !== p.id).map((x, idx) => ({ ...x, passengerNumber: idx + 1 })))}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {section === "billing" && (
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                <FormField label="Card Holder Name" required><Input value={billing.cardHolderName} onChange={e => setBilling(b => ({ ...b, cardHolderName: e.target.value }))} /></FormField>
                <FormField label="Card Type" required>
                  <Select value={billing.cardProcessorId} onValueChange={v => setBilling(b => ({ ...b, cardProcessorId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{processors.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </FormField>
                <FormField label="Card Number" required hint="Only the last 4 digits are ever stored.">
                  <Input inputMode="numeric" placeholder="•••• •••• •••• ••••" value={billing.cardNumber} onChange={e => setBilling(b => ({ ...b, cardNumber: e.target.value }))} />
                </FormField>
                <FormField label="CVV Number" hint="Never stored or sent to the server.">
                  <Input inputMode="numeric" maxLength={4} placeholder="•••" onChange={() => {}} />
                </FormField>
                <FormField label="Expiry Date" required>
                  <div className="flex gap-2">
                    <Input placeholder="MM" inputMode="numeric" maxLength={2} value={billing.expiryMonth} onChange={e => setBilling(b => ({ ...b, expiryMonth: e.target.value }))} />
                    <Input placeholder="YYYY" inputMode="numeric" maxLength={4} value={billing.expiryYear} onChange={e => setBilling(b => ({ ...b, expiryYear: e.target.value }))} />
                  </div>
                </FormField>
                <FormField label="Email" required><Input type="email" value={billing.billingEmail} onChange={e => setBilling(b => ({ ...b, billingEmail: e.target.value }))} /></FormField>
                <FormField label="Contact No." required><Input value={billing.billingContactNo} onChange={e => setBilling(b => ({ ...b, billingContactNo: e.target.value }))} /></FormField>
                <FormField label="Street"><Input value={billing.billingStreet} onChange={e => setBilling(b => ({ ...b, billingStreet: e.target.value }))} /></FormField>
                <FormField label="City"><Input value={billing.billingCity} onChange={e => setBilling(b => ({ ...b, billingCity: e.target.value }))} /></FormField>
                <FormField label="State"><Input value={billing.billingState} onChange={e => setBilling(b => ({ ...b, billingState: e.target.value }))} /></FormField>
                <FormField label="ZIP Code"><Input value={billing.billingZip} onChange={e => setBilling(b => ({ ...b, billingZip: e.target.value }))} /></FormField>
                <FormField label="Country"><Input value={billing.billingCountry} onChange={e => setBilling(b => ({ ...b, billingCountry: e.target.value }))} /></FormField>
              </div>
            )}

            {section === "special" && (
              <p className="text-sm text-slate-400 text-center py-8">No special fields required for this transaction type.</p>
            )}

            {section === "attachments" && (
              <div>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-md p-10 text-center text-sm text-slate-400 cursor-pointer hover:border-slate-300"
                  onClick={() => {
                    const url = window.prompt("File URL (upload storage isn't wired up yet — paste a URL to attach)")
                    if (url) setAttachments(a => [...a, { fileUrl: url, fileName: url.split("/").pop() ?? "file" }])
                  }}
                >
                  Drag and drop, click to select, or paste images here
                </div>
                {attachments.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {attachments.map((a, i) => (
                      <li key={i} className="flex items-center justify-between">
                        {a.fileName}
                        <button onClick={() => setAttachments(as => as.filter((_, idx) => idx !== i))} className="text-red-500 text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {errors.length > 0 && (
              <div className="mt-5 bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-medium text-red-700 mb-1">Required fields missing</p>
                <ul className="text-xs text-red-600 list-disc list-inside">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={previous} disabled={section === SECTIONS[0].key} leftIcon={<ChevronLeft className="h-4 w-4" />}>
              Previous
            </Button>
            {isLastSection ? (
              <Button onClick={handleCreate} loading={createBooking.isPending} leftIcon={<Save className="h-4 w-4" />}>
                Create Transaction
              </Button>
            ) : (
              <Button onClick={next} rightIcon={<ChevronRight className="h-4 w-4" />}>Next</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
