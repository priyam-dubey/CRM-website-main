import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcrypt"

const prisma = new PrismaClient()

const PASSENGERS = [
  "Olivia Bennett", "Liam Carter", "Emma Rodriguez", "Noah Patel", "Ava Thompson",
  "Ethan Kim", "Sophia Nguyen", "Mason Clarke", "Isabella Rossi", "Lucas Meyer",
  "Mia Kowalski", "Benjamin Osei", "Charlotte Dubois", "Henry Alvarez", "Amelia Singh",
  "Jack Sullivan", "Harper Weiss", "Daniel Fontaine", "Evelyn Cho", "Michael Lindgren",
  "Abigail Novak", "Samuel Okafor", "Emily Tanaka", "David Hoffmann", "Elizabeth Moreau",
  "Joseph Almeida", "Sofia Larsen", "Matthew Ibrahim", "Victoria Park", "Andrew Costa",
]

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000)
}
function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 86_400_000)
}
function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

async function main() {
  console.log("Seeding database...")

  // ── Company ──────────────────────────────────────────────
  // metadata carries the "Itinerary Authorization" email branding (logo/
  // support contact/address shown in the header/footer) — see
  // BookingVerificationService.readBranding. Values mirror the client's own
  // screenshots so the demo email matches their original CRM's output.
  const company = await prisma.company.upsert({
    where: { slug: "demo-company" },
    update: {},
    create: {
      name: "Demo Company", slug: "demo-company", isActive: true, ipRestrictionEnabled: true,
      metadata: {
        brandName: "aerodeals",
        supportPhoneUsa: "888-807-5420",
        supportPhoneMexico: "800-351-0189",
        supportEmail: "customersupport@yourbookingdetail.com",
        address: "9600 Two Notch Rd #5 Columbia, SC 29223, USA",
      },
    },
  })
  console.log("Company:", company.slug)

  // ── Users ────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("password", 12)
  const admin = await prisma.user.upsert({
    where: { email_companyId: { email: "admin@demo.com", companyId: company.id } },
    update: {},
    create: {
      companyId: company.id, email: "admin@demo.com", passwordHash,
      firstName: "Alex", lastName: "Morgan", role: "ADMIN", isActive: true,
    },
  })
  console.log("Admin user:", admin.email)

  const manager = await prisma.user.upsert({
    where: { email_companyId: { email: "manager@demo.com", companyId: company.id } },
    update: {},
    create: {
      companyId: company.id, email: "manager@demo.com", passwordHash,
      firstName: "Sarah", lastName: "Chen", role: "MANAGER", isActive: true,
    },
  })

  const operator = await prisma.user.upsert({
    where: { email_companyId: { email: "operator@demo.com", companyId: company.id } },
    update: {},
    create: {
      companyId: company.id, email: "operator@demo.com", passwordHash,
      firstName: "James", lastName: "Wilson", role: "OPERATOR", isActive: true,
    },
  })

  // ── Reference data ───────────────────────────────────────
  // Currency list matches the per-charge currency dropdown in the client's
  // original CRM (USD/MXN/INR/EURO/CAD/ARS) exactly, plus GBP/AED already
  // used elsewhere in this demo dataset.
  const currencySeeds = [
    { code: "USD", name: "US Dollar",      symbol: "$",   decimalPlaces: 2 },
    { code: "MXN", name: "Mexican Peso",   symbol: "$",   decimalPlaces: 2 },
    { code: "INR", name: "Indian Rupee",   symbol: "₹",   decimalPlaces: 2 },
    { code: "EUR", name: "Euro",           symbol: "€",   decimalPlaces: 2 },
    { code: "CAD", name: "Canadian Dollar",symbol: "$",   decimalPlaces: 2 },
    { code: "ARS", name: "Argentine Peso", symbol: "$",   decimalPlaces: 2 },
    { code: "GBP", name: "British Pound",  symbol: "£",   decimalPlaces: 2 },
    { code: "AED", name: "UAE Dirham",     symbol: "د.إ", decimalPlaces: 2 },
  ]
  for (const c of currencySeeds) {
    await prisma.currency.upsert({ where: { code: c.code }, update: {}, create: { ...c, isActive: true } })
  }
  const currencies = await prisma.currency.findMany({ where: { code: { in: currencySeeds.map(c => c.code) } } }) as Array<{ id: string }>

  // Airline list matches the client's original CRM's airline dropdown
  // (screenshots) as closely as reasonably reproducible. Note: "Expedia"
  // appeared in that dropdown too, sandwiched among real airlines — almost
  // certainly a data artifact in the client's own system (a provider name
  // leaking into an airline list), not intentionally an airline, so it is
  // deliberately NOT included here. Flag to the client if it should be.
  const airlineSeeds = [
    { airlineName: "American Airlines",  iataCode: "AA", icaoCode: "AAL", country: "United States" },
    { airlineName: "Delta Airlines",     iataCode: "DL", icaoCode: "DAL", country: "United States" },
    { airlineName: "United Airlines",    iataCode: "UA", icaoCode: "UAL", country: "United States" },
    { airlineName: "Spirit Airlines",    iataCode: "NK", icaoCode: "NKS", country: "United States" },
    { airlineName: "Frontier Airlines",  iataCode: "F9", icaoCode: "FFT", country: "United States" },
    { airlineName: "JetBlue Airways",    iataCode: "B6", icaoCode: "JBU", country: "United States" },
    { airlineName: "Southwest Airlines", iataCode: "WN", icaoCode: "SWA", country: "United States" },
    { airlineName: "Alaska Airlines",    iataCode: "AS", icaoCode: "ASA", country: "United States" },
    { airlineName: "Air Canada",         iataCode: "AC", icaoCode: "ACA", country: "Canada" },
    { airlineName: "Air France",         iataCode: "AF", icaoCode: "AFR", country: "France" },
    { airlineName: "Emirates",           iataCode: "EK", icaoCode: "UAE", country: "United Arab Emirates" },
    { airlineName: "British Airways",    iataCode: "BA", icaoCode: "BAW", country: "United Kingdom" },
    { airlineName: "Qatar Airways",      iataCode: "QR", icaoCode: "QTR", country: "Qatar" },
    { airlineName: "Volaris",            iataCode: "Y4", icaoCode: "VOI", country: "Mexico" },
    { airlineName: "Viva Aerobus",       iataCode: "VB", icaoCode: "VIV", country: "Mexico" },
    { airlineName: "Wingo",              iataCode: "P5", icaoCode: "WIT", country: "Colombia" },
    { airlineName: "WestJet",            iataCode: "WS", icaoCode: "WJA", country: "Canada" },
    { airlineName: "Turkish Airlines",   iataCode: "TK", icaoCode: "THY", country: "Turkey" },
    { airlineName: "Copa Airlines",      iataCode: "CM", icaoCode: "CMP", country: "Panama" },
    { airlineName: "ANA",                iataCode: "NH", icaoCode: "ANA", country: "Japan" },
    { airlineName: "Aeromexico",         iataCode: "AM", icaoCode: "AMX", country: "Mexico" },
    { airlineName: "Air Europa",         iataCode: "UX", icaoCode: "AEA", country: "Spain" },
    { airlineName: "Air Transat",        iataCode: "TS", icaoCode: "TSC", country: "Canada" },
    { airlineName: "Avianca",            iataCode: "AV", icaoCode: "AVA", country: "Colombia" },
    { airlineName: "Condor",             iataCode: "DE", icaoCode: "CFG", country: "Germany" },
    { airlineName: "China Airlines",     iataCode: "CI", icaoCode: "CAL", country: "Taiwan" },
    { airlineName: "Etihad Airways",     iataCode: "EY", icaoCode: "ETD", country: "United Arab Emirates" },
    { airlineName: "Aerolineas Argentinas", iataCode: "AR", icaoCode: "ARG", country: "Argentina" },
    { airlineName: "Brussels Airlines",  iataCode: "SN", icaoCode: "BEL", country: "Belgium" },
    { airlineName: "Swiss International Air Lines", iataCode: "LX", icaoCode: "SWR", country: "Switzerland" },
    { airlineName: "Hainan Airlines",    iataCode: "HU", icaoCode: "CHH", country: "China" },
    { airlineName: "China Eastern Airlines", iataCode: "MU", icaoCode: "CES", country: "China" },
    { airlineName: "China Southern Airlines", iataCode: "CZ", icaoCode: "CSN", country: "China" },
    { airlineName: "Shanghai Airlines",  iataCode: "FM", icaoCode: "CSH", country: "China" },
    { airlineName: "Air China",          iataCode: "CA", icaoCode: "CCA", country: "China" },
    { airlineName: "Aer Lingus",         iataCode: "EI", icaoCode: "EIN", country: "Ireland" },
    { airlineName: "Arajet",             iataCode: "DM", icaoCode: "AJT", country: "Dominican Republic" },
    { airlineName: "Singapore Airlines", iataCode: "SQ", icaoCode: "SIA", country: "Singapore" },
    { airlineName: "Royal Jordanian",    iataCode: "RJ", icaoCode: "RJA", country: "Jordan" },
    { airlineName: "Lufthansa",          iataCode: "LH", icaoCode: "DLH", country: "Germany" },
    { airlineName: "Air India",          iataCode: "AI", icaoCode: "AIC", country: "India" },
    { airlineName: "KLM",                iataCode: "KL", icaoCode: "KLM", country: "Netherlands" },
  ]
  for (const a of airlineSeeds) {
    const exists = await prisma.airline.findFirst({ where: { iataCode: a.iataCode, companyId: null } })
    if (!exists) await prisma.airline.create({ data: { ...a, companyId: null, isActive: true } })
  }
  const airlines = await prisma.airline.findMany({ where: { iataCode: { in: airlineSeeds.map(a => a.iataCode) }, companyId: null } }) as Array<{ id: string }>

  // Class list matches the client's original CRM's class dropdown exactly.
  const classSeeds = [
    { name: "Basic Economy",       code: "BE" },
    { name: "Economy",             code: "Y" },
    { name: "Premium Economy",     code: "W" },
    { name: "Economy Plus",        code: "EP" },
    { name: "Comfort+",            code: "CP" },
    { name: "Economy Extra",       code: "EX" },
    { name: "Business",            code: "J" },
    { name: "First Class",         code: "F" },
    { name: "Main Cabin",          code: "MC" },
    { name: "Delta Main Classic",  code: "DC" },
    { name: "Business Basic",      code: "BB" },
    { name: "Economy Flex",        code: "EF" },
  ]
  for (const c of classSeeds) {
    const exists = await prisma.bookingClass.findFirst({ where: { code: c.code, companyId: null } })
    if (!exists) await prisma.bookingClass.create({ data: { ...c, companyId: null, isActive: true } })
  }
  const classes = await prisma.bookingClass.findMany({ where: { code: { in: classSeeds.map(c => c.code) }, companyId: null } }) as Array<{ id: string }>

  const providerSeeds = [
    { name: "Aerodeals", logoUrl: null as string | null },
    { name: "Amadeus",   logoUrl: null as string | null },
    { name: "Sabre",     logoUrl: null as string | null },
    { name: "Galileo",   logoUrl: null as string | null },
  ]
  for (const p of providerSeeds) {
    const exists = await prisma.provider.findFirst({ where: { name: p.name, companyId: null } })
    if (!exists) await prisma.provider.create({ data: { ...p, companyId: null, isActive: true } })
  }
  const providers = await prisma.provider.findMany({ where: { name: { in: providerSeeds.map(p => p.name) }, companyId: null } }) as Array<{ id: string }>

  const processorSeeds = [
    { name: "Visa",             shortCode: "VI" },
    { name: "Mastercard",       shortCode: "CA" },
    { name: "American Express", shortCode: "AX" },
    { name: "Discover",         shortCode: "DS" },
  ]
  for (const p of processorSeeds) {
    const exists = await prisma.cardProcessor.findFirst({ where: { name: p.name, companyId: null } })
    if (!exists) await prisma.cardProcessor.create({ data: { ...p, companyId: null, isActive: true } })
  }
  const processors = await prisma.cardProcessor.findMany({ where: { name: { in: processorSeeds.map(p => p.name) }, companyId: null } }) as Array<{ id: string }>

  const callQueue = await prisma.callQueue.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: { id: "00000000-0000-0000-0000-000000000001", companyId: company.id, name: "General Enquiries", phone: "9878967879", isActive: true },
  })

  console.log("Reference data ready:", {
    currencies: currencies.length, airlines: airlines.length, classes: classes.length,
    providers: providers.length, processors: processors.length,
  })

  // ── Dummy transactional dataset (bookings, revenue, notes, notifications, logs) ──
  // Gated on bookings already existing for this company, so re-running `db:seed`
  // never duplicates this dataset. Use `npm run db:reset` for a clean slate.
  const existingBookings = await prisma.booking.count({ where: { companyId: company.id } })

  if (existingBookings > 0) {
    console.log(`Skipping demo dataset — ${existingBookings} bookings already exist for this company.`)
  } else {
    console.log("Seeding demo dataset (bookings, revenue, notes, notifications, logs)...")

    const users = [admin, manager, operator]
    const STATUS_CYCLE: Array<"PENDING" | "CONFIRMED" | "TICKETED" | "CANCELLED" | "REFUNDED" | "CHARGEBACK"> = [
      "TICKETED", "TICKETED", "CONFIRMED", "TICKETED", "PENDING",
      "TICKETED", "CANCELLED", "TICKETED", "REFUNDED", "TICKETED",
      "CONFIRMED", "TICKETED", "CHARGEBACK", "TICKETED", "PENDING",
    ]

    const bookings: Awaited<ReturnType<typeof prisma.booking.create>>[] = []

    for (let i = 0; i < PASSENGERS.length; i++) {
      const status       = pick(STATUS_CYCLE, i)
      const airline      = pick(airlines, i)
      const bookingClass = pick(classes, i + 1)
      const provider     = pick(providers, i)
      const processor    = pick(processors, i + 2)
      const currency     = pick(currencies, i)
      const createdBy    = i % 4 === 0 ? manager : admin
      const assignedTo   = i % 5 === 0 ? null : pick(users, i)
      const gross        = 15_000 + (i * 733) % 40_000 // in minor units (cents)
      const net          = Math.round(gross * 0.87)

      // Booking row first — bidNumber/reference generated the same way
      // BookingsService.create() does (sequence -> format -> update).
      const created = await prisma.booking.create({
        data: {
          companyId:    company.id,
          reference:    "PENDING",
          pnr:          `PNR${(1000 + i * 37).toString(36).toUpperCase()}`,
          customerEmail: `${PASSENGERS[i].toLowerCase().replace(/\s+/g, ".")}@example.com`,
          status,
          providerId:   provider.id,
          callQueueId:  i % 3 === 0 ? callQueue.id : null,
          assignedToId: assignedTo?.id,
          createdById:  createdBy.id,
          isUrgent:     i % 6 === 0,
          createdAt:    daysAgo(60 - i * 1.5),
        },
      })
      const reference = `BID${created.bidNumber}`
      const booking = await prisma.booking.update({ where: { id: created.id }, data: { reference } })
      bookings.push(booking)

      // Charges & Fees — one charge per booking in this demo dataset.
      await prisma.charge.create({
        data: { bookingId: booking.id, chargeNumber: 1, amount: gross, currencyId: currency.id, description: `Base fare — ${reference}` },
      })

      // Itinerary Details — one outbound segment; every third booking also
      // gets a return segment, matching the client's One Way/Round Trip mix.
      const [firstName, ...rest] = PASSENGERS[i].split(" ")
      const lastName = rest.join(" ") || "-"
      const departureAt = i % 2 === 0 ? daysFromNow(5 + i) : daysAgo(5 + i)
      const returnAt     = i % 3 === 0 ? daysFromNow(12 + i) : null
      await prisma.itinerarySegment.create({
        data: {
          bookingId: booking.id, direction: "OUTBOUND", segmentNumber: 1,
          airlineId: airline.id, flightNumber: String(1000 + i), fromText: "USA", toText: "INDIA",
          departureAt, arrivalAt: new Date(departureAt.getTime() + 8 * 3_600_000),
          classId: bookingClass.id, pnrConfirmation: `PNR${(1000 + i * 37).toString(36).toUpperCase()}`,
        },
      })
      if (returnAt) {
        await prisma.itinerarySegment.create({
          data: {
            bookingId: booking.id, direction: "RETURN", segmentNumber: 1,
            airlineId: airline.id, flightNumber: String(2000 + i), fromText: "INDIA", toText: "USA",
            departureAt: returnAt, arrivalAt: new Date(returnAt.getTime() + 8 * 3_600_000),
            classId: bookingClass.id,
          },
        })
      }

      // Passenger Details — primary adult passenger.
      await prisma.passenger.create({
        data: { bookingId: booking.id, passengerNumber: 1, type: "ADULT", firstName, lastName },
      })

      // Billing & Payment — PCI-safe by construction: only cardLast4 exists
      // as a column at all, no raw PAN, no CVV, matching BillingDetail's
      // schema (see schema.prisma comment on that model).
      await prisma.billingDetail.create({
        data: {
          bookingId: booking.id, cardHolderName: `${firstName} ${lastName}`.toUpperCase(),
          cardProcessorId: processor.id, cardLast4: String(1000 + i * 37).slice(-4),
          expiryMonth: (i % 12) + 1, expiryYear: 2027 + (i % 3),
          billingEmail: `${PASSENGERS[i].toLowerCase().replace(/\s+/g, ".")}@example.com`,
          billingContactNo: `+1555${String(1000000 + i * 91).slice(0, 7)}`,
          billingCity: "Columbia", billingState: "SC", billingZip: "29223", billingCountry: "USA",
          purchaseDate: daysAgo(60 - i * 1.5),
        },
      })

      // Every booking has exactly one BookingTransaction (Transaction #1) —
      // the seed script creates bookings directly via Prisma rather than
      // through BookingsService.create(), so it must do this itself too.
      // Vary the type across a few bookings so Find Bookings shows a
      // realistic mix of badges, same as the client's own data.
      const demoTxnType = i % 7 === 0 ? "EXCHANGE" : i % 5 === 0 ? "TICKET_REISSUANCE" : "NEW_BOOKING"
      await prisma.bookingTransaction.create({
        data: {
          bookingId: booking.id, transactionNumber: 1,
          transactionType: demoTxnType, status: "COMPLETED",
          createdById: createdBy.id,
        },
      })

      // Revenue entries for anything past PENDING
      if (status !== "PENDING") {
        const entryDate = daysAgo(55 - i * 1.5)
        await prisma.revenue.create({
          data: {
            companyId: company.id, bookingId: booking.id, currencyId: currency.id,
            type: "FARE", grossAmount: gross, netAmount: net,
            description: `Base fare — ${booking.reference}`,
            entryDate, createdById: createdBy.id,
          },
        })
        const tax = Math.round(gross * 0.08)
        await prisma.revenue.create({
          data: {
            companyId: company.id, bookingId: booking.id, currencyId: currency.id,
            type: "TAX", grossAmount: tax, netAmount: tax,
            description: `Taxes — ${booking.reference}`,
            entryDate, createdById: createdBy.id,
          },
        })
        const fee = 1_500 + (i % 5) * 300
        await prisma.revenue.create({
          data: {
            companyId: company.id, bookingId: booking.id, currencyId: currency.id,
            type: "FEE", grossAmount: fee, netAmount: fee,
            description: `Service fee — ${booking.reference}`,
            entryDate, createdById: createdBy.id,
          },
        })
      }

      // MCO for a handful of ticketed bookings
      if (status === "TICKETED" && i % 3 === 0) {
        await prisma.mCO.create({
          data: {
            companyId: company.id, bookingId: booking.id, airlineId: airline.id,
            mcoNumber: `MCO${100000 + i}`, amount: Math.round(gross * 0.15),
            currencyId: currency.id, reason: "Additional baggage allowance",
            issuedAt: daysAgo(50 - i), createdById: createdBy.id,
          },
        })
      }

      // Chargeback for CHARGEBACK-status bookings
      if (status === "CHARGEBACK") {
        await prisma.chargeback.create({
          data: {
            companyId: company.id, bookingId: booking.id, cardProcessorId: processor.id,
            amount: gross, currencyId: currency.id,
            status: pick(["OPEN", "UNDER_REVIEW", "WON", "LOST"] as const, i),
            reason: "Cardholder disputes charge — claims booking was cancelled by airline.",
            filedAt: daysAgo(20 - (i % 10)), createdById: createdBy.id,
          },
        })
      }

      // Refund for REFUNDED-status bookings
      if (status === "REFUNDED") {
        await prisma.refund.create({
          data: {
            companyId: company.id, bookingId: booking.id, amount: gross,
            currencyId: currency.id,
            status: pick(["PENDING", "APPROVED", "REJECTED", "PROCESSED"] as const, i),
            reason: "Passenger requested cancellation within policy window.",
            requestedAt: daysAgo(15 - (i % 10)),
            processedAt: i % 2 === 0 ? daysAgo(10 - (i % 8)) : null,
            createdById: createdBy.id,
          },
        })
      }

      // A note on every 3rd booking
      if (i % 3 === 0) {
        await prisma.bookingNote.create({
          data: {
            bookingId: booking.id, userId: pick(users, i).id,
            note: "Confirmed passenger details with airline; no further action needed.",
          },
        })
      }
    }
    console.log(`Created ${bookings.length} bookings with revenue/MCO/chargeback/refund/notes.`)

    // ── Notifications ────────────────────────────────────
    const notifSeeds: Array<{ title: string; body: string; severity: "INFO" | "SUCCESS" | "WARNING" | "ERROR" }> = [
      { title: "New booking created",       body: `Booking ${bookings[0]?.reference} was created for Olivia Bennett.`, severity: "INFO" },
      { title: "Payment confirmed",         body: `Payment for ${bookings[2]?.reference} was successfully processed.`, severity: "SUCCESS" },
      { title: "Chargeback filed",          body: `A chargeback was filed against booking ${bookings[12]?.reference}.`, severity: "WARNING" },
      { title: "Refund processed",          body: `Refund for booking ${bookings[8]?.reference} has been processed.`,  severity: "SUCCESS" },
      { title: "Booking cancelled",         body: `Booking ${bookings[6]?.reference} was cancelled by the passenger.`, severity: "WARNING" },
      { title: "Failed login attempt",      body: "A failed login attempt was detected from a new IP address.", severity: "ERROR" },
      { title: "Weekly revenue summary",    body: "Your weekly revenue report is ready to view.",      severity: "INFO" },
      { title: "MCO issued",                body: `An MCO was issued for booking ${bookings[3]?.reference}.`,           severity: "INFO" },
      { title: "IP rule updated",           body: "A new IP allow rule was added to Security settings.", severity: "INFO" },
      { title: "Card processor delay",      body: "Stripe reported a temporary delay processing payments.", severity: "WARNING" },
    ]
    for (const [i, n] of notifSeeds.entries()) {
      await prisma.notification.create({
        data: {
          companyId: company.id, userId: i % 2 === 0 ? admin.id : manager.id,
          title: n.title, body: n.body, severity: n.severity,
          sourceType: "Booking", sourceId: bookings[i % bookings.length]?.id,
          readAt: i % 3 === 0 ? daysAgo(1) : null,
          createdAt: daysAgo(10 - i),
        },
      })
    }
    console.log(`Created ${notifSeeds.length} notifications.`)

    // ── IP rules ─────────────────────────────────────────
    await prisma.iPRule.create({
      data: {
        companyId: company.id, type: "ALLOW", cidr: "203.0.113.0/24",
        description: "Head office network", createdById: admin.id,
      },
    })
    await prisma.iPRule.create({
      data: {
        companyId: company.id, type: "DENY", cidr: "198.51.100.42/32",
        description: "Blocked after repeated failed logins", createdById: admin.id,
      },
    })
    console.log("Created 2 IP rules.")

    // ── Activity log ─────────────────────────────────────
    const activitySeeds: Array<{ action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN"; entityType: string; label: string }> = [
      { action: "LOGIN",  entityType: "Session", label: "admin@demo.com" },
      { action: "CREATE", entityType: "Booking", label: `${bookings[0]?.reference}` },
      { action: "CREATE", entityType: "Booking", label: `${bookings[1]?.reference}` },
      { action: "UPDATE", entityType: "Booking", label: `${bookings[2]?.reference}` },
      { action: "CREATE", entityType: "Airline", label: "Emirates" },
      { action: "LOGIN",  entityType: "Session", label: "manager@demo.com" },
      { action: "UPDATE", entityType: "Booking", label: `${bookings[6]?.reference}` },
      { action: "DELETE", entityType: "Booking", label: `${bookings[19]?.reference ?? 'N/A'}` },
      { action: "CREATE", entityType: "Refund",  label: `${bookings[8]?.reference}` },
      { action: "CREATE", entityType: "Chargeback", label: `${bookings[12]?.reference}` },
    ]
    for (const [i, a] of activitySeeds.entries()) {
      const actor = i % 3 === 0 ? manager : admin
      await prisma.activityLog.create({
        data: {
          companyId: company.id, actorId: actor.id, actorName: `${actor.firstName} ${actor.lastName}`,
          action: a.action, entityType: a.entityType, entityLabel: a.label,
          ipAddress: "203.0.113.10", userAgent: "Mozilla/5.0 (Seed Script)",
          createdAt: daysAgo(30 - i * 2),
        },
      })
    }
    console.log(`Created ${activitySeeds.length} activity log entries.`)

    // ── Security log ──────────────────────────────────────
    const securitySeeds: Array<{ event: "LOGIN" | "LOGOUT" | "FAILED_LOGIN" | "IP_BLOCKED"; userId?: string }> = [
      { event: "LOGIN", userId: admin.id },
      { event: "LOGIN", userId: manager.id },
      { event: "LOGOUT", userId: manager.id },
      { event: "FAILED_LOGIN" },
      { event: "FAILED_LOGIN" },
      { event: "IP_BLOCKED" },
      { event: "LOGIN", userId: operator.id },
    ]
    for (const [i, s] of securitySeeds.entries()) {
      await prisma.securityLog.create({
        data: {
          companyId: company.id, userId: s.userId, event: s.event,
          ipAddress: i % 2 === 0 ? "203.0.113.10" : "198.51.100.42",
          userAgent: "Mozilla/5.0 (Seed Script)",
          createdAt: daysAgo(20 - i * 2),
        },
      })
    }
    console.log(`Created ${securitySeeds.length} security log entries.`)

    // ── Quick notes (personal scratchpad, unrelated to bookings) ──
    const quickNoteSeeds: Array<{ user: typeof admin; note: string }> = [
      { user: admin,   note: "Follow up with finance on the Q3 chargeback backlog." },
      { user: manager, note: "Remind operators about the new baggage policy before it goes live." },
      { user: operator, note: "Double-check PNRs for the Emirates group booking before Friday." },
    ]
    for (const q of quickNoteSeeds) {
      await prisma.quickNote.create({
        data: { companyId: company.id, userId: q.user.id, note: q.note },
      })
    }
    console.log(`Created ${quickNoteSeeds.length} quick notes.`)

    // ── Saved view (bookings table, admin) ────────────────
    await prisma.savedView.create({
      data: {
        companyId: company.id, userId: admin.id, tableKey: "bookings",
        name: "Ticketed this month", filters: { status: "TICKETED" },
        sortBy: "createdAt", sortDir: "desc", isDefault: false,
      },
    })
    console.log("Created 1 saved view.")
  }

  console.log("Seed complete. Login: admin@demo.com / password (also manager@demo.com, operator@demo.com)")
}

main()
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
