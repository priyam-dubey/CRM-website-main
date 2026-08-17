import { BookingStatus } from "../../shared/types/prisma.types"
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { EventEmitter2 }      from "@nestjs/event-emitter"
import { BookingsRepository } from "./bookings.repository"
import { PrismaService }      from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import { sanitiseSnapshot }   from "../../shared/utils/diff.util"
import { formatBid }          from "../../shared/utils/bid.util"
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
    const booking = await this.prisma.$transaction(async (tx) => {
      // Booking row first — bidNumber is assigned by the DB sequence on
      // insert, so `reference` (the client's original CRM's user-facing
      // identifier, e.g. "BID1879") can only be computed immediately after.
      const created = await tx.booking.create({
        data: {
          company:    { connect: { id: companyId } },
          reference:  "PENDING", // placeholder, overwritten below once bidNumber is known
          pnr:        dto.pnr,
          customerEmail: dto.customerEmail,
          status:     dto.status ?? "PENDING",
          provider:   { connect: { id: dto.providerId } },
          ...(dto.callQueueId  ? { callQueue:  { connect: { id: dto.callQueueId } } }  : {}),
          ...(dto.assignedToId ? { assignedTo: { connect: { id: dto.assignedToId } } } : {}),
          createdBy:  { connect: { id: actor.sub } },
          isUrgent:   dto.isUrgent ?? false,
        },
      })

      const reference = formatBid(created.bidNumber)
      const b = await tx.booking.update({ where: { id: created.id }, data: { reference } })

      await tx.charge.createMany({
        data: dto.charges.map(c => ({
          bookingId: b.id, chargeNumber: c.chargeNumber, amount: c.amount,
          currencyId: c.currencyId, description: c.description,
        })),
      })

      await tx.itinerarySegment.createMany({
        data: dto.segments.map(s => ({
          bookingId: b.id, direction: s.direction ?? "OUTBOUND", segmentNumber: s.segmentNumber,
          airlineId: s.airlineId, flightNumber: s.flightNumber, fromText: s.fromText, toText: s.toText,
          departureAt: new Date(s.departureAt), arrivalAt: new Date(s.arrivalAt),
          classId: s.classId, pnrConfirmation: s.pnrConfirmation,
        })),
      })

      await tx.passenger.createMany({
        data: dto.passengers.map(p => ({
          bookingId: b.id, passengerNumber: p.passengerNumber, type: p.type,
          firstName: p.firstName, middleName: p.middleName, lastName: p.lastName,
          dob: p.dob ? new Date(p.dob) : null, ticketNumber: p.ticketNumber,
        })),
      })

      // PCI-safe by construction: dto.billing never contained a full card
      // number or CVV in the first place (see BillingInputDto) — only
      // cardLast4 reaches this insert.
      await tx.billingDetail.create({
        data: {
          bookingId: b.id, cardHolderName: dto.billing.cardHolderName,
          cardProcessorId: dto.billing.cardProcessorId, cardLast4: dto.billing.cardLast4,
          expiryMonth: dto.billing.expiryMonth, expiryYear: dto.billing.expiryYear,
          billingEmail: dto.billing.billingEmail, billingContactNo: dto.billing.billingContactNo,
          billingStreet: dto.billing.billingStreet, billingCity: dto.billing.billingCity,
          billingState: dto.billing.billingState, billingZip: dto.billing.billingZip,
          billingCountry: dto.billing.billingCountry,
          purchaseDate: dto.billing.purchaseDate ? new Date(dto.billing.purchaseDate) : new Date(),
        },
      })

      if (dto.attachments?.length) {
        await tx.attachment.createMany({
          data: dto.attachments.map(a => ({
            bookingId: b.id, fileUrl: a.fileUrl, fileName: a.fileName, uploadedById: actor.sub,
          })),
        })
      }

      // One FARE revenue entry per charge — each charge already carries its
      // own currency, so this maps 1:1 rather than requiring a single
      // booking-level total the way it did before charges were multi-row.
      for (const c of dto.charges) {
        await tx.revenue.create({
          data: {
            company: { connect: { id: companyId } }, booking: { connect: { id: b.id } },
            currency: { connect: { id: c.currencyId } }, type: "FARE",
            grossAmount: c.amount, netAmount: c.amount,
            description: c.description ?? `Charge #${c.chargeNumber} for ${reference}`,
            createdBy: { connect: { id: actor.sub } },
          },
        })
      }

      // Transaction #1 — every booking has exactly one BookingTransaction
      // today. "Special Details" (step 6 of the wizard) lives in `metadata`
      // here rather than a new model — see schema.prisma.
      await tx.bookingTransaction.create({
        data: {
          booking: { connect: { id: b.id } }, transactionNumber: 1,
          transactionType: dto.transactionType ?? "NEW_BOOKING", status: "COMPLETED",
          createdBy: { connect: { id: actor.sub } },
          metadata: dto.specialDetails ?? undefined,
        },
      })

      await tx.activityLog.create({
        data: {
          company: { connect: { id: companyId } }, actor: { connect: { id: actor.sub } },
          actorName: `${actor.sub}`, action: "CREATE" as any, entityType: "Booking",
          entityId: b.id, entityLabel: reference, afterSnapshot: sanitiseSnapshot(b as any),
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
      ...(dto.customerEmail  ? { customerEmail: dto.customerEmail }  : {}),
      ...(dto.pnr            ? { pnr:            dto.pnr }            : {}),
      ...(dto.status         ? { status:         dto.status }         : {}),
      ...(dto.providerId     ? { provider:      { connect: { id: dto.providerId } } }     : {}),
      ...(dto.callQueueId !== undefined ? { callQueue: dto.callQueueId ? { connect: { id: dto.callQueueId } } : { disconnect: true } } : {}),
      ...(dto.assignedToId !== undefined ? { assignedTo: dto.assignedToId ? { connect: { id: dto.assignedToId } } : { disconnect: true } } : {}),
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
