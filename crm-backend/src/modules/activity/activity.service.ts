import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import type { ActivityAction, Prisma } from "../../shared/types/prisma.types"
import type { CursorPaginationDto } from "../../common/dto/pagination.dto"

export interface WriteActivityParams {
  companyId:      string
  actorId?:       string
  actorName:      string
  action:         string
  entityType:     string
  entityId?:      string
  entityLabel?:   string
  beforeSnapshot?: Record<string, unknown>
  afterSnapshot?:  Record<string, unknown>
  ipAddress?:     string
  userAgent?:     string
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Non-blocking write — never throws, never delays the caller */
  write(params: WriteActivityParams): void {
    setImmediate(async () => {
      try {
        await this.prisma.activityLog.create({
          data: {
            company:     { connect: { id: params.companyId } },
            ...(params.actorId ? { actor: { connect: { id: params.actorId } } } : {}),
            actorName:      params.actorName,
            action:         params.action,
            entityType:     params.entityType,
            entityId:       params.entityId,
            entityLabel:    params.entityLabel,
            beforeSnapshot: params.beforeSnapshot as Prisma.InputJsonValue,
            afterSnapshot:  params.afterSnapshot  as Prisma.InputJsonValue,
            ipAddress:      params.ipAddress,
            userAgent:      params.userAgent,
          },
        })
      } catch (err) {
        console.error("[ActivityService] Failed to write audit log:", err)
      }
    })
  }

  async findAll(companyId: string, dto: CursorPaginationDto, filters?: {
    entityType?: string
    actorId?: string
    action?: ActivityAction
  }) {
    const where: Prisma.ActivityLogWhereInput = {
      companyId,
      ...(filters?.entityType ? { entityType: filters.entityType } : {}),
      ...(filters?.actorId    ? { actorId:    filters.actorId }    : {}),
      ...(filters?.action     ? { action:     filters.action }     : {}),
      ...(dto.cursor ? { id: { lt: dto.cursor } } : {}),
    }

    const logs = await this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take:    dto.limit + 1,
    })

    const hasMore    = logs.length > dto.limit
    const data       = hasMore ? logs.slice(0, dto.limit) : logs
    const nextCursor = hasMore ? data[data.length - 1].id : null

    return { data, next_cursor: nextCursor, has_more: hasMore }
  }

  async findByActor(actorId: string, companyId: string, dto: CursorPaginationDto) {
    return this.findAll(companyId, dto, { actorId })
  }
}
