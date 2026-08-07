import { Injectable, NotFoundException } from "@nestjs/common"
import { OnEvent }       from "@nestjs/event-emitter"
import { PrismaService } from "../../database/prisma.service"
import { EVENTS }        from "../../shared/constants/events.constants"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import { NotificationSeverity, Prisma } from "../../shared/types/prisma.types"
import type { PaginationDto } from "../../common/dto/pagination.dto"

export interface CreateNotificationParams {
  companyId:   string
  userId:      string
  title:       string
  body:        string
  severity?:   NotificationSeverity | string
  sourceType?: string
  sourceId?:   string
  actionUrl?:  string
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateNotificationParams) {
    return this.prisma.notification.create({
      data: {
        company:    { connect: { id: params.companyId } },
        user:       { connect: { id: params.userId } },
        title:      params.title,
        body:       params.body,
        severity:   (params.severity ?? NotificationSeverity.INFO) as any,
        sourceType: params.sourceType,
        sourceId:   params.sourceId,
        actionUrl:  params.actionUrl,
      },
    })
  }

  async findAll(userId: string, companyId: string, dto: PaginationDto) {
    const where: Prisma.NotificationWhereInput = { userId, companyId, dismissedAt: null }
    const skip = (dto.page - 1) * dto.per_page

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: dto.per_page,
      }),
      this.prisma.notification.count({ where }),
    ])

    const unreadCount = await this.prisma.notification.count({ where: { ...where, readAt: null } })

    return {
      data: notifications,
      meta: { ...buildPaginationMeta(dto.page, dto.per_page, total), unread_count: unreadCount },
    }
  }

  async markRead(id: string, userId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notif) throw new NotFoundException("Notification not found")
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
  }

  async markAllRead(userId: string, companyId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, companyId, readAt: null },
      data:  { readAt: new Date() },
    })
  }

  async dismiss(id: string, userId: string) {
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } })
    if (!notif) throw new NotFoundException("Notification not found")
    await this.prisma.notification.update({ where: { id }, data: { dismissedAt: new Date() } })
  }

  async unreadCount(userId: string, companyId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, companyId, readAt: null, dismissedAt: null } })
  }

  // ─── Event listeners ────────────────────────────────────────

  @OnEvent(EVENTS.BOOKING_CREATED)
  async onBookingCreated(payload: { booking: any; actor: any }) {
    // Notify all managers and admins in the company
    const managers = await this.prisma.user.findMany({
      where: { companyId: payload.booking.companyId, role: { in: ["ADMIN","MANAGER"] }, isActive: true, deletedAt: null },
      select: { id: true },
    })
    for (const mgr of managers) {
      if (mgr.id === payload.actor.sub) continue  // don't notify creator
      await this.create({
        companyId:  payload.booking.companyId,
        userId:     mgr.id,
        title:      "New booking created",
        body:       `Booking ${payload.booking.reference ?? ""} was created`,
        severity:   NotificationSeverity.INFO,
        sourceType: "Booking",
        sourceId:   payload.booking.id,
        actionUrl:  `/bookings/${payload.booking.id}`,
      })
    }
  }

  @OnEvent(EVENTS.CHARGEBACK_FILED)
  async onChargebackFiled(payload: { chargeback: any; companyId: string }) {
    const admins = await this.prisma.user.findMany({
      where: { companyId: payload.companyId, role: "ADMIN", isActive: true, deletedAt: null },
      select: { id: true },
    })
    for (const admin of admins) {
      await this.create({
        companyId:  payload.companyId,
        userId:     admin.id,
        title:      "Chargeback filed",
        body:       `A chargeback has been filed for booking`,
        severity:   NotificationSeverity.WARNING,
        sourceType: "Chargeback",
        sourceId:   payload.chargeback.id,
      })
    }
  }
}
