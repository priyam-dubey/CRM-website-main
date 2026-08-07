import { Injectable, ConflictException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { getPaginationSkip } from "../../shared/utils/pagination.util"
import type { BookingFiltersDto } from "./dto/booking-filters.dto"
import type { Prisma } from "../../shared/types/prisma.types"

const LIST_SELECT = {
  id: true, reference: true, pnr: true, passengerName: true, passengerEmail: true,
  status: true, grossAmount: true, netAmount: true, travelDate: true, returnDate: true,
  createdAt: true, updatedAt: true, version: true, isUrgent: true,
  airline:       { select: { id: true, airlineName: true, iataCode: true } },
  class:         { select: { id: true, name: true, code: true } },
  provider:      { select: { id: true, name: true } },
  cardProcessor: { select: { id: true, name: true } },
  currency:      { select: { id: true, code: true, symbol: true, decimalPlaces: true } },
  assignedTo:    { select: { id: true, firstName: true, lastName: true, email: true } },
  createdBy:     { select: { id: true, firstName: true, lastName: true } },
  transactions:  {
    select: { id: true, transactionNumber: true, transactionType: true, status: true },
    orderBy: { transactionNumber: "desc" as const },
    take: 1,
  },
} as const

const DETAIL_SELECT = {
  ...LIST_SELECT,
  passengerPhone: true,
  notes: true,
  callQueueId: true,
  mco:        { select: { id: true, mcoNumber: true, amount: true, issuedAt: true } },
  chargebacks:{ select: { id: true, amount: true, status: true, filedAt: true } },
  refunds:    { select: { id: true, amount: true, status: true, requestedAt: true } },
} as const

@Injectable()
export class BookingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: BookingFiltersDto) {
    const where: Prisma.BookingWhereInput = {
      companyId,
      deletedAt: null,
      ...(filters.status          ? { status:          filters.status }          : {}),
      ...(filters.airline_id      ? { airlineId:       filters.airline_id }      : {}),
      ...(filters.provider_id     ? { providerId:      filters.provider_id }     : {}),
      ...(filters.card_processor_id ? { cardProcessorId: filters.card_processor_id } : {}),
      ...(filters.assigned_to_id  ? { assignedToId:    filters.assigned_to_id }  : {}),
      ...(filters.date_from || filters.date_to ? {
        createdAt: {
          ...(filters.date_from ? { gte: new Date(filters.date_from) } : {}),
          ...(filters.date_to   ? { lte: new Date(filters.date_to) }   : {}),
        },
      } : {}),
      ...(filters.is_urgent !== undefined ? { isUrgent: filters.is_urgent === "true" } : {}),
      ...(filters.search && filters.search_field ? {
        [filters.search_field]: { contains: filters.search, mode: "insensitive" },
      } : {}),
      ...(filters.search && !filters.search_field ? {
        OR: [
          { passengerName: { contains: filters.search, mode: "insensitive" } },
          { reference:     { contains: filters.search, mode: "insensitive" } },
          { pnr:           { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
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

  async findById(id: string, companyId: string) {
    return this.prisma.booking.findFirst({
      where: { id, companyId, deletedAt: null },
      select: DETAIL_SELECT,
    })
  }

  async create(data: Prisma.BookingCreateInput) {
    return this.prisma.booking.create({ data, select: DETAIL_SELECT })
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

  async generateReference(companyId: string): Promise<string> {
    const count = await this.prisma.booking.count({ where: { companyId } })
    const year  = new Date().getFullYear()
    return `BK-${year}-${String(count + 1001).padStart(5, "0")}`
  }
}
