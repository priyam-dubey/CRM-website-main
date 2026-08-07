import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { EventEmitter2 }  from "@nestjs/event-emitter"
import { PrismaService }  from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import { resolveDateRange } from "../../shared/utils/date-range.util"
import { EVENTS }         from "../../shared/constants/events.constants"
import type { CreateRevenueDto }   from "./dto/create-revenue.dto"
import type { UpdateRevenueDto }   from "./dto/update-revenue.dto"
import type { RevenueFiltersDto }  from "./dto/revenue-filters.dto"
import type { CreateMcoDto }       from "./mco/dto/create-mco.dto"
import type { CreateChargebackDto } from "./chargebacks/dto/create-chargeback.dto"
import type { CreateRefundDto }    from "./refunds/dto/create-refund.dto"
import type { JwtPayload }         from "../../shared/types/request.types"
import type { Prisma }             from "../../shared/types/prisma.types"

@Injectable()
export class RevenueService {
  constructor(
    private readonly prisma:       PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(companyId: string, filters: RevenueFiltersDto) {
    const where: Prisma.RevenueWhereInput = {
      companyId,
      deletedAt: null,
      ...(filters.booking_id  ? { bookingId:  filters.booking_id }  : {}),
      ...(filters.currency_id ? { currencyId: filters.currency_id } : {}),
      ...(filters.type        ? { type:       filters.type }        : {}),
      ...(filters.date_from || filters.date_to ? {
        entryDate: {
          ...(filters.date_from ? { gte: new Date(filters.date_from) } : {}),
          ...(filters.date_to   ? { lte: new Date(filters.date_to) }   : {}),
        },
      } : {}),
    }
    const skip = (filters.page - 1) * filters.per_page
    const orderBy: Prisma.RevenueOrderByWithRelationInput = { entryDate: "desc" }

    const [revenue, total] = await this.prisma.$transaction([
      this.prisma.revenue.findMany({ where, orderBy, skip, take: filters.per_page,
        include: { currency: { select: { code: true, symbol: true, decimalPlaces: true } } },
      }),
      this.prisma.revenue.count({ where }),
    ])

    return { data: revenue, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }

  async create(companyId: string, dto: CreateRevenueDto, actor: JwtPayload) {
    return this.prisma.revenue.create({
      data: {
        company:     { connect: { id: companyId } },
        booking:     { connect: { id: dto.bookingId } },
        currency:    { connect: { id: dto.currencyId } },
        type:        dto.type,
        grossAmount: dto.grossAmount,
        netAmount:   dto.netAmount,
        description: dto.description,
        entryDate:   dto.entryDate ? new Date(dto.entryDate) : new Date(),
        createdBy:   { connect: { id: actor.sub } },
      },
    })
  }

  async update(id: string, companyId: string, dto: UpdateRevenueDto) {
    const existing = await this.prisma.revenue.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!existing) throw new NotFoundException(`Revenue entry ${id} not found`)

    const result = await this.prisma.revenue.updateMany({
      where: { id, companyId, version: dto.version ?? existing.version },
      data:  {
        ...(dto.grossAmount  ? { grossAmount:  dto.grossAmount }  : {}),
        ...(dto.netAmount    ? { netAmount:    dto.netAmount }    : {}),
        ...(dto.description  ? { description: dto.description } : {}),
        version: { increment: 1 },
      },
    })
    if (result.count === 0) throw new ConflictException("Revenue entry was modified concurrently. Refresh and try again.")
    return this.prisma.revenue.findUnique({ where: { id } })
  }

  async remove(id: string, companyId: string) {
    const existing = await this.prisma.revenue.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!existing) throw new NotFoundException(`Revenue entry ${id} not found`)
    await this.prisma.revenue.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } })
  }

  async getDashboard(
    companyId: string,
    currencyId?: string,
    period?: string,
    range?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // Backward compatible: existing callers pass `period` (week/month/year);
    // new callers pass `range` (today/last_30_days/this_month/last_12_months/
    // this_year) or an explicit date_from/date_to. `range`/custom take
    // priority when present.
    const { since, until } = (range || dateFrom || dateTo)
      ? resolveDateRange(range, dateFrom, dateTo)
      : (() => {
          const days = period === "year" ? 365 : period === "month" ? 30 : period === "week" ? 7 : 30
          return { since: new Date(Date.now() - days * 86_400_000), until: new Date() }
        })()

    const where: Prisma.RevenueWhereInput = {
      companyId, deletedAt: null,
      entryDate: { gte: since, lte: until },
      ...(currencyId ? { currencyId } : {}),
    }

    const [totals, chartRaw, activeAgents, bookingsInRange] = await this.prisma.$transaction([
      this.prisma.revenue.groupBy({
        by: ["type"],
        where,
        _sum: { grossAmount: true, netAmount: true },
      }),
      this.prisma.revenue.findMany({
        where,
        select: { entryDate: true, grossAmount: true, netAmount: true, type: true },
        orderBy: { entryDate: "asc" },
      }),
      this.prisma.user.count({ where: { companyId, isActive: true } }),
      this.prisma.booking.findMany({
        where: { companyId, deletedAt: null, createdAt: { gte: since, lte: until } },
        select: {
          id: true,
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          createdBy:  { select: { id: true, firstName: true, lastName: true } },
          mco:        { select: { amount: true } },
        },
      }),
    ])

    const totalGross  = totals.find(t => t.type === "FARE")?._sum.grossAmount ?? 0
    const totalNet    = totals.find(t => t.type === "FARE")?._sum.netAmount ?? 0
    const totalCB     = totals.find(t => t.type === "CHARGEBACK")?._sum.grossAmount ?? 0
    const totalRefund = totals.find(t => t.type === "REFUND")?._sum.grossAmount ?? 0

    // Group chart data by day
    const byDay = new Map<string, { gross: number; net: number; chargebacks: number }>()
    for (const r of chartRaw) {
      const day = r.entryDate.toISOString().split("T")[0]
      if (!byDay.has(day)) byDay.set(day, { gross: 0, net: 0, chargebacks: 0 })
      const d = byDay.get(day)!
      if (r.type === "FARE")       { d.gross += r.grossAmount; d.net += r.netAmount }
      if (r.type === "CHARGEBACK") { d.chargebacks += r.grossAmount }
    }
    const chartData = Array.from(byDay.entries()).map(([date, v]) => ({ date, ...v }))

    // Top/Bottom Performers — grouped by the agent responsible for the
    // booking (assignedTo, falling back to createdBy for unassigned
    // bookings), ranked by MCO revenue within the selected range.
    const byAgent = new Map<string, { agentId: string; name: string; mcoRevenue: number; totalBookings: number }>()
    for (const b of bookingsInRange as any[]) {
      const agent = b.assignedTo ?? b.createdBy
      const agentId = agent?.id ?? "unknown"
      const name = agent ? `${agent.firstName} ${agent.lastName}` : "Unknown"
      if (!byAgent.has(agentId)) byAgent.set(agentId, { agentId, name, mcoRevenue: 0, totalBookings: 0 })
      const a = byAgent.get(agentId)!
      a.totalBookings += 1
      a.mcoRevenue += b.mco?.amount ?? 0
    }
    const ranked = Array.from(byAgent.values()).sort((a, b) => b.mcoRevenue - a.mcoRevenue)
    const topPerformers    = ranked.slice(0, 3)
    const bottomPerformers = ranked.slice(-3).reverse().filter(p => !topPerformers.includes(p))

    return {
      data: {
        totals: { gross: totalGross, net: totalNet, chargebacks: totalCB, refunds: totalRefund },
        chartData,
        totalBookings: bookingsInRange.length,
        activeAgents,
        topPerformers,
        bottomPerformers,
      },
    }
  }

  // Revenue Details — booking-level table matching the client's Revenue
  // Details page: Booking ID / MCO / Refund / Chargeback / Booking status /
  // Date / Agent, with Agent/Provider/status-checkbox filters and totals.
  async findRevenueDetails(companyId: string, filters: import("./dto/revenue-details-filters.dto").RevenueDetailsFiltersDto) {
    const { since, until } = (filters.range || filters.date_from || filters.date_to)
      ? resolveDateRange(filters.range, filters.date_from, filters.date_to)
      : { since: new Date(0), until: new Date() }

    const statusIn: string[] = []
    if (filters.ticketed_mco === "true") statusIn.push("TICKETED")
    if (filters.pending === "true")      statusIn.push("PENDING")

    const where: any = {
      companyId, deletedAt: null,
      createdAt: { gte: since, lte: until },
      ...(filters.agent_id    ? { assignedToId: filters.agent_id } : {}),
      ...(filters.provider_id ? { providerId: filters.provider_id } : {}),
      ...(statusIn.length ? { status: { in: statusIn } } : {}),
      ...(filters.refund === "true"     ? { refunds:     { some: {} } } : {}),
      ...(filters.chargeback === "true" ? { chargebacks: { some: {} } } : {}),
    }

    const skip = (filters.page - 1) * filters.per_page
    const [bookings, total, aggregates] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where, skip, take: filters.per_page,
        orderBy: { createdAt: filters.sort_dir ?? "desc" },
        select: {
          id: true, reference: true, status: true, createdAt: true, grossAmount: true, netAmount: true,
          mco:         { select: { amount: true } },
          refunds:     { select: { amount: true } },
          chargebacks: { select: { amount: true } },
          assignedTo:  { select: { firstName: true, lastName: true } },
          createdBy:   { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where, select: { grossAmount: true, netAmount: true, refunds: { select: { amount: true } }, chargebacks: { select: { amount: true } } },
      }),
    ])

    const rows = bookings.map((b: any) => {
      const agent = b.assignedTo ?? b.createdBy
      return {
        bookingId:   b.reference,
        mco:         b.mco?.amount ?? 0,
        refund:      b.refunds.reduce((s: number, r: any) => s + r.amount, 0),
        chargeback:  b.chargebacks.reduce((s: number, c: any) => s + c.amount, 0),
        bookingStatus: b.status,
        date:        b.createdAt,
        agent:       agent ? `${agent.firstName} ${agent.lastName}` : "Unknown",
      }
    })

    const totalRevenue = aggregates.reduce((s: number, b: any) => s + b.grossAmount, 0)
    const netRevenue    = aggregates.reduce((s: number, b: any) => s + b.netAmount, 0)
    const totalRefunds = aggregates.reduce((s: number, b: any) => s + b.refunds.reduce((x: number, r: any) => x + r.amount, 0), 0)
    const totalChargebacks = aggregates.reduce((s: number, b: any) => s + b.chargebacks.reduce((x: number, c: any) => x + c.amount, 0), 0)

    return {
      data: rows,
      meta: buildPaginationMeta(filters.page, filters.per_page, total),
      totals: {
        totalRevenue, totalBookings: total, netRevenue,
        totalRefunds, totalChargebacks,
        refundsAndChargebacks: totalRefunds + totalChargebacks,
      },
    }
  }

  async exportRevenueDetailsCsv(companyId: string, filters: import("./dto/revenue-details-filters.dto").RevenueDetailsFiltersDto) {
    const { data } = await this.findRevenueDetails(companyId, { ...filters, page: 1, per_page: 1000 })
    const header = "Booking ID,MCO,Refund,Chargeback,Booking Status,Date,Agent"
    const lines = data.map(r =>
      [r.bookingId, r.mco, r.refund, r.chargeback, r.bookingStatus, new Date(r.date).toISOString(), `"${r.agent}"`].join(","),
    )
    return [header, ...lines].join("\n")
  }

  // MCO
  async createMco(companyId: string, dto: CreateMcoDto, actor: JwtPayload) {
    const existing = await this.prisma.mCO.findFirst({ where: { bookingId: dto.bookingId, deletedAt: null } })
    if (existing) throw new ConflictException("This booking already has an MCO")
    return this.prisma.mCO.create({
      data: {
        companyId,
        booking:    { connect: { id: dto.bookingId } },
        airline:    { connect: { id: dto.airlineId } },
        currency:   { connect: { id: dto.currencyId } },
        mcoNumber:  dto.mcoNumber,
        amount:     dto.amount,
        reason:     dto.reason,
        issuedAt:   new Date(dto.issuedAt),
        createdById: actor.sub,
      },
    })
  }

  async findAllMcos(companyId: string, filters: { page: number; per_page: number }) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.mCO.findMany({ where: { companyId, deletedAt: null }, orderBy: { createdAt: "desc" }, skip: (filters.page-1)*filters.per_page, take: filters.per_page }),
      this.prisma.mCO.count({ where: { companyId, deletedAt: null } }),
    ])
    return { data, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }

  // Chargebacks
  async createChargeback(companyId: string, dto: CreateChargebackDto, actor: JwtPayload) {
    const cb = await this.prisma.chargeback.create({
      data: {
        companyId,
        booking:       { connect: { id: dto.bookingId } },
        cardProcessor: { connect: { id: dto.cardProcessorId } },
        currency:      { connect: { id: dto.currencyId } },
        amount:        dto.amount,
        reason:        dto.reason,
        createdById:   actor.sub,
      },
    })
    this.eventEmitter.emit(EVENTS.CHARGEBACK_FILED, { chargeback: cb, companyId })
    return cb
  }

  async findAllChargebacks(companyId: string, filters: { page: number; per_page: number }) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.chargeback.findMany({ where: { companyId, deletedAt: null }, orderBy: { filedAt: "desc" }, skip: (filters.page-1)*filters.per_page, take: filters.per_page }),
      this.prisma.chargeback.count({ where: { companyId, deletedAt: null } }),
    ])
    return { data, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }

  // Refunds
  async createRefund(companyId: string, dto: CreateRefundDto, actor: JwtPayload) {
    return this.prisma.refund.create({
      data: {
        companyId,
        booking:    { connect: { id: dto.bookingId } },
        currency:   { connect: { id: dto.currencyId } },
        amount:     dto.amount,
        reason:     dto.reason,
        createdById: actor.sub,
      },
    })
  }

  async findAllRefunds(companyId: string, filters: { page: number; per_page: number }) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.refund.findMany({ where: { companyId, deletedAt: null }, orderBy: { requestedAt: "desc" }, skip: (filters.page-1)*filters.per_page, take: filters.per_page }),
      this.prisma.refund.count({ where: { companyId, deletedAt: null } }),
    ])
    return { data, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }
}
