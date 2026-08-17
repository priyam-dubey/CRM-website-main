import { Injectable, ConflictException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { getPaginationSkip } from "../../shared/utils/pagination.util"
import type { BookingFiltersDto } from "./dto/booking-filters.dto"
import type { Prisma } from "../../shared/types/prisma.types"

const LIST_SELECT = {
  id: true, bidNumber: true, reference: true, pnr: true, customerEmail: true,
  status: true, createdAt: true, updatedAt: true, version: true, isUrgent: true,
  provider:      { select: { id: true, name: true } },
  assignedTo:    { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:     { select: { id: true, firstName: true, lastName: true } },
  passengers:    {
    select: { id: true, firstName: true, lastName: true, type: true },
    orderBy: { passengerNumber: "asc" as const },
    take: 1,
  },
  segments: {
    select: { id: true, airlineId: true, departureAt: true, arrivalAt: true, fromText: true, toText: true },
    orderBy: { departureAt: "asc" as const },
    take: 1,
  },
  charges: { select: { amount: true, currencyId: true } },
  transactions:  {
    select: { id: true, transactionNumber: true, transactionType: true, status: true },
    orderBy: { transactionNumber: "desc" as const },
    take: 1,
  },
} as const

const DETAIL_SELECT = {
  ...LIST_SELECT,
  passengers: { orderBy: { passengerNumber: "asc" as const } },
  segments:   { orderBy: [{ direction: "asc" as const }, { segmentNumber: "asc" as const }], include: { airline: { select: { id: true, airlineName: true, iataCode: true } }, class: { select: { id: true, name: true, code: true } } } },
  charges:    { orderBy: { chargeNumber: "asc" as const }, include: { currency: { select: { id: true, code: true, symbol: true } } } },
  billing:    { select: { id: true, cardHolderName: true, cardLast4: true, expiryMonth: true, expiryYear: true, billingEmail: true, billingContactNo: true, billingStreet: true, billingCity: true, billingState: true, billingZip: true, billingCountry: true, purchaseDate: true, cardProcessor: { select: { id: true, name: true } } } },
  attachments: { select: { id: true, fileUrl: true, fileName: true, createdAt: true } },
  callQueueId: true,
  mco:        { select: { id: true, mcoNumber: true, amount: true, issuedAt: true } },
  chargebacks:{ select: { id: true, amount: true, status: true, filedAt: true } },
  refunds:    { select: { id: true, amount: true, status: true, requestedAt: true } },
  verifications: {
    select: { id: true, status: true, clientEmail: true, verifiedAt: true, expiresAt: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: BookingFiltersDto) {
    const where: Prisma.BookingWhereInput = {
      companyId,
      deletedAt: null,
      ...(filters.status          ? { status:          filters.status }          : {}),
      ...(filters.provider_id     ? { providerId:      filters.provider_id }     : {}),
      ...(filters.assigned_to_id  ? { assignedToId:    filters.assigned_to_id }  : {}),
      ...(filters.date_from || filters.date_to ? {
        createdAt: {
          ...(filters.date_from ? { gte: new Date(filters.date_from) } : {}),
          ...(filters.date_to   ? { lte: new Date(filters.date_to) }   : {}),
        },
      } : {}),
      ...(filters.is_urgent !== undefined ? { isUrgent: filters.is_urgent === "true" } : {}),
      ...(filters.search && filters.search_field === "passengerName" ? {
        passengers: { some: { OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName:  { contains: filters.search, mode: "insensitive" } },
        ] } },
      } : {}),
      ...(filters.search && filters.search_field && filters.search_field !== "passengerName" ? {
        [filters.search_field === "bidNumber" ? "reference" : filters.search_field]: { contains: filters.search, mode: "insensitive" },
      } : {}),
      ...(filters.search && !filters.search_field ? {
        OR: [
          { reference:     { contains: filters.search, mode: "insensitive" } },
          { pnr:           { contains: filters.search, mode: "insensitive" } },
          { customerEmail: { contains: filters.search, mode: "insensitive" } },
          { passengers: { some: { OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName:  { contains: filters.search, mode: "insensitive" } },
          ] } } },
        ],
      } : {}),
    }

    // Urgent Bookings must be sorted by soonest travel date first — now the
    // earliest ItinerarySegment.departureAt across a booking's segments,
    // since travelDate no longer lives directly on Booking. Prisma's typed
    // API doesn't support ordering by an aggregate (MIN) of a to-many
    // relation, so this specific case uses a raw, parameterised query
    // instead of $transaction([findMany, count]) — still fully paginated at
    // the DB level, just via SQL rather than the query builder.
    if (filters.is_urgent === "true") {
      return this.findManyUrgentByEarliestDeparture(where, filters)
    }

    const orderBy: Prisma.BookingOrderByWithRelationInput =
      filters.sort_by ? { [filters.sort_by]: filters.sort_dir ?? "desc" } : { createdAt: "desc" }

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, select: LIST_SELECT, orderBy,
        skip: getPaginationSkip(filters.page, filters.per_page),
        take: filters.per_page,
      }),
      this.prisma.booking.count({ where }),
    ])

    return [bookings, total] as const
  }

  private async findManyUrgentByEarliestDeparture(where: Prisma.BookingWhereInput, filters: BookingFiltersDto) {
    // isUrgent is already guaranteed true by the caller's `where`, and
    // is_urgent is always a boolean-string filter — companyId is the only
    // dynamic value we need to parameterise safely here.
    const companyId = (where as { companyId: string }).companyId
    const skip = getPaginationSkip(filters.page, filters.per_page)

    const ids = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT b.id
      FROM "bookings" b
      WHERE b."companyId" = ${companyId}
        AND b."deletedAt" IS NULL
        AND b."isUrgent" = true
      ORDER BY (
        SELECT MIN(s."departureAt") FROM "itinerary_segments" s WHERE s."bookingId" = b.id
      ) ASC NULLS LAST
      OFFSET ${skip} LIMIT ${filters.per_page}
    `
    const total = await this.prisma.booking.count({ where })
    if (ids.length === 0) return [[], total] as const

    // Re-fetch via the typed API for the actual select shape, then restore
    // the raw query's ordering (Prisma's `findMany` with `id: { in }` does
    // not preserve array order).
    const rows = await this.prisma.booking.findMany({ where: { id: { in: ids.map(r => r.id) } }, select: LIST_SELECT })
    const byId = new Map(rows.map(r => [r.id, r]))
    const ordered = ids.map(r => byId.get(r.id)).filter((r): r is typeof rows[number] => !!r)

    return [ordered, total] as const
  }

  async findById(id: string, companyId: string) {
    return this.prisma.booking.findFirst({
      where: { id, companyId, deletedAt: null },
      select: DETAIL_SELECT,
    })
  }

  async update(id: string, companyId: string, version: number, data: Prisma.BookingUpdateInput) {
    // Optimistic locking: only update if version matches
    const result = await this.prisma.booking.updateMany({
      where: { id, companyId, version, deletedAt: null },
      data:  { ...data, version: { increment: 1 } },
    })
    if (result.count === 0) {
      throw new ConflictException("Booking was modified by another user. Please refresh and try again.")
    }
    return this.findById(id, companyId)
  }

  async softDelete(id: string, companyId: string) {
    await this.prisma.booking.updateMany({
      where: { id, companyId, deletedAt: null },
      data:  { deletedAt: new Date() },
    })
  }

  async bulkSoftDelete(ids: string[], companyId: string): Promise<number> {
    const result = await this.prisma.booking.updateMany({
      where: { id: { in: ids }, companyId, deletedAt: null },
      data:  { deletedAt: new Date() },
    })
    return result.count
  }

  async bulkAssign(ids: string[], companyId: string, assignedToId: string | null): Promise<number> {
    const result = await this.prisma.booking.updateMany({
      where: { id: { in: ids }, companyId, deletedAt: null },
      data:  { assignedToId },
    })
    return result.count
  }
}
