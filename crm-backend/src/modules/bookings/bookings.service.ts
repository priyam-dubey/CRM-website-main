import { BookingStatus } from "../../shared/types/prisma.types"
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { EventEmitter2 }      from "@nestjs/event-emitter"
import { BookingsRepository } from "./bookings.repository"
import { PrismaService }      from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import { sanitiseSnapshot }   from "../../shared/utils/diff.util"
import { EVENTS }             from "../../shared/constants/events.constants"
import type { CreateBookingDto } from "./dto/create-booking.dto"
import type { UpdateBookingDto } from "./dto/update-booking.dto"
import type { BookingFiltersDto } from "./dto/booking-filters.dto"
import type { BulkIdsDto, BulkAssignDto } from "./dto/bulk-action.dto"
import type { JwtPayload }  from "../../shared/types/request.types"

@Injectable()
export class BookingsService {
  constructor(
    private readonly repo:         BookingsRepository,
    private readonly prisma:       PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(companyId: string, filters: BookingFiltersDto) {
    const [bookings, total] = await this.repo.findMany(companyId, filters)
    return { data: bookings, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }

  async findById(id: string, companyId: string) {
    const booking = await this.repo.findById(id, companyId)
    if (!booking) throw new NotFoundException(`Booking ${id} not found`)
    return booking
  }

  async create(companyId: string, dto: CreateBookingDto, actor: JwtPayload) {
    const reference = await this.repo.generateReference(companyId)

    const booking = await this.prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: {
          company:       { connect: { id: companyId } },
          reference,
          pnr:           dto.pnr,
          passengerName: dto.passengerName,
          passengerEmail: dto.passengerEmail,
          passengerPhone: dto.passengerPhone,
          status:        dto.status ?? "PENDING",
          airline:       { connect: { id: dto.airlineId } },
          class:         { connect: { id: dto.classId } },
          provider:      { connect: { id: dto.providerId } },
          cardProcessor: { connect: { id: dto.cardProcessorId } },
          currency:      { connect: { id: dto.currencyId } },
          ...(dto.callQueueId  ? { callQueue:  { connect: { id: dto.callQueueId } } }  : {}),
          ...(dto.assignedToId ? { assignedTo: { connect: { id: dto.assignedToId } } } : {}),
          createdBy:     { connect: { id: actor.sub } },
          grossAmount:   dto.grossAmount,
          netAmount:     dto.grossAmount,  // initially net = gross
          travelDate:    new Date(dto.travelDate),
          ...(dto.returnDate ? { returnDate: new Date(dto.returnDate) } : {}),
          notes: dto.notes,
          isUrgent: dto.isUrgent ?? false,
        },
      })

      // Create initial FARE revenue entry
      await tx.revenue.create({
        data: {
          company:     { connect: { id: companyId } },
          booking:     { connect: { id: b.id } },
          currency:    { connect: { id: dto.currencyId } },
          type:        "FARE",
          grossAmount: dto.grossAmount,
          netAmount:   dto.grossAmount,
          description: `Initial fare for ${reference}`,
          createdBy:   { connect: { id: actor.sub } },
        },
      })

      // Transaction #1 — every booking has exactly one BookingTransaction today.
      // See IMPLEMENTATION.md "Booking transaction architecture" for why this
      // exists and how a later "Create Revision" action extends it.
      await tx.bookingTransaction.create({
        data: {
          booking:          { connect: { id: b.id } },
          transactionNumber: 1,
          transactionType:  dto.transactionType ?? "NEW_BOOKING",
          status:           "COMPLETED",
          createdBy:        { connect: { id: actor.sub } },
        },
      })

      // Activity log
      await tx.activityLog.create({
        data: {
          company:     { connect: { id: companyId } },
          actor:       { connect: { id: actor.sub } },
          actorName:   `${actor.sub}`,
          action:      "CREATE" as any,
          entityType:  "Booking",
          entityId:    b.id,
          entityLabel: reference,
          afterSnapshot: sanitiseSnapshot(b as any),
        },
      })

      return b
    })

    this.eventEmitter.emit(EVENTS.BOOKING_CREATED, { booking, actor })
    return this.repo.findById(booking.id, companyId)
  }

  async update(id: string, companyId: string, dto: UpdateBookingDto, actor: JwtPayload) {
    const existing = await this.findById(id, companyId)
    const version  = dto.version ?? (existing as any).version ?? 0

    const beforeSnap = sanitiseSnapshot(existing as any)

    const updated = await this.repo.update(id, companyId, version, {
      ...(dto.passengerName  ? { passengerName:  dto.passengerName }  : {}),
      ...(dto.passengerEmail ? { passengerEmail: dto.passengerEmail } : {}),
      ...(dto.passengerPhone ? { passengerPhone: dto.passengerPhone } : {}),
      ...(dto.pnr            ? { pnr:            dto.pnr }            : {}),
      ...(dto.status         ? { status:         dto.status }         : {}),
      ...(dto.airlineId      ? { airline:       { connect: { id: dto.airlineId } } }      : {}),
      ...(dto.classId        ? { class:         { connect: { id: dto.classId } } }        : {}),
      ...(dto.providerId     ? { provider:      { connect: { id: dto.providerId } } }     : {}),
      ...(dto.cardProcessorId ? { cardProcessor: { connect: { id: dto.cardProcessorId } } } : {}),
      ...(dto.currencyId     ? { currency:      { connect: { id: dto.currencyId } } }     : {}),
      ...(dto.assignedToId !== undefined ? { assignedTo: dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true } } : {}),
      ...(dto.grossAmount    ? { grossAmount: dto.grossAmount, netAmount: dto.grossAmount } : {}),
      ...(dto.travelDate     ? { travelDate: new Date(dto.travelDate) } : {}),
      ...(dto.returnDate     ? { returnDate: new Date(dto.returnDate) } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      ...(dto.isUrgent !== undefined ? { isUrgent: dto.isUrgent } : {}),
    })

    // Log the change
    setImmediate(async () => {
      try {
        await this.prisma.activityLog.create({
          data: {
            company:        { connect: { id: companyId } },
            actor:          { connect: { id: actor.sub } },
            actorName:      actor.sub,
            action:         "UPDATE",
            entityType:     "Booking",
            entityId:       id,
            entityLabel:    (existing as any).reference,
            beforeSnapshot: beforeSnap,
            afterSnapshot:  sanitiseSnapshot(updated as any),
          },
        })
      } catch (err) {
        console.error("Failed to write booking update activity log:", err)
      }
    })

    this.eventEmitter.emit(EVENTS.BOOKING_UPDATED, { booking: updated, actor })
    return updated
  }

  async cancel(id: string, companyId: string, actor: JwtPayload) {
    const booking = await this.findById(id, companyId)
    const nonCancellable = ["CANCELLED", "REFUNDED"]
    if (nonCancellable.includes((booking as any).status)) {
      throw new BadRequestException(`Cannot cancel a booking with status ${(booking as any).status}`)
    }
    return this.update(id, companyId, { status: BookingStatus.CANCELLED as any, version: (booking as any).version }, actor)
  }

  async remove(id: string, companyId: string, actor: JwtPayload) {
    const booking = await this.findById(id, companyId)
    await this.repo.softDelete(id, companyId)
    setImmediate(async () => {
      try {
        await this.prisma.activityLog.create({
          data: {
            company:        { connect: { id: companyId } },
            actor:          { connect: { id: actor.sub } },
            actorName:      actor.sub,
            action:         "DELETE",
            entityType:     "Booking",
            entityId:       id,
            entityLabel:    (booking as any).reference,
            beforeSnapshot: sanitiseSnapshot(booking as any),
          },
        })
      } catch (err) {
        console.error("Failed to write booking delete activity log:", err)
      }
    })
    this.eventEmitter.emit(EVENTS.BOOKING_DELETED, { bookingId: id, actor })
  }

  async bulkDelete(dto: BulkIdsDto, companyId: string, actor: JwtPayload) {
    const deleted = await this.repo.bulkSoftDelete(dto.ids, companyId)
    setImmediate(async () => {
      try {
        await this.prisma.activityLog.create({
          data: {
            company:      { connect: { id: companyId } },
            actor:        { connect: { id: actor.sub } },
            actorName:    actor.sub,
            action:       "DELETE",
            entityType:   "Booking",
            entityLabel:  `Bulk delete: ${deleted} bookings`,
            afterSnapshot: { ids: dto.ids, count: deleted },
          },
        })
      } catch (err) {
        console.error("Failed to write bulk delete activity log:", err)
      }
    })
    return { deleted }
  }

  async bulkAssign(dto: BulkAssignDto, companyId: string, actor: JwtPayload) {
    const updated = await this.repo.bulkAssign(dto.ids, companyId, dto.assignedToId)
    return { updated }
  }
}
