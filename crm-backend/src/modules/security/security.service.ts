import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import type { CreateIpRuleDto }  from "./ip-rules/dto/create-ip-rule.dto"
import type { UpdateIpRuleDto }  from "./ip-rules/dto/update-ip-rule.dto"
import type { PaginationDto }    from "../../common/dto/pagination.dto"
import type { SecurityEvent, Prisma } from "../../shared/types/prisma.types"

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── IP Rules ──────────────────────────────────────────────

  async getIpSettingsSummary(companyId: string) {
    const [company, allowedCount, blockedCount, lastRule] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId }, select: { ipRestrictionEnabled: true } }),
      this.prisma.iPRule.count({ where: { companyId, deletedAt: null, type: "ALLOW" } }),
      this.prisma.iPRule.count({ where: { companyId, deletedAt: null, type: "DENY" } }),
      this.prisma.iPRule.findFirst({ where: { companyId, deletedAt: null }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    ])
    return {
      enabled: company?.ipRestrictionEnabled ?? false,
      allowedCount, blockedCount,
      lastUpdatedAt: lastRule?.updatedAt ?? null,
    }
  }

  async setIpRestrictionEnabled(companyId: string, enabled: boolean) {
    await this.prisma.company.update({ where: { id: companyId }, data: { ipRestrictionEnabled: enabled } })
    return { enabled }
  }

  async findAllIpRules(companyId: string, dto: PaginationDto) {
    const where = { companyId, deletedAt: null }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.iPRule.findMany({ where, orderBy: { createdAt: "desc" }, skip: (dto.page-1)*dto.per_page, take: dto.per_page }),
      this.prisma.iPRule.count({ where }),
    ])
    return { data, meta: buildPaginationMeta(dto.page, dto.per_page, total) }
  }

  async createIpRule(companyId: string, dto: CreateIpRuleDto, createdById: string) {
    return this.prisma.iPRule.create({
      data: { companyId, type: dto.type, cidr: dto.cidr, description: dto.description, createdById },
    })
  }

  async updateIpRule(id: string, companyId: string, dto: UpdateIpRuleDto) {
    const existing = await this.prisma.iPRule.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!existing) throw new NotFoundException(`IP rule ${id} not found`)
    return this.prisma.iPRule.update({ where: { id }, data: dto })
  }

  async deleteIpRule(id: string, companyId: string) {
    const existing = await this.prisma.iPRule.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!existing) throw new NotFoundException(`IP rule ${id} not found`)
    await this.prisma.iPRule.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  // ─── Security Logs ────────────────────────────────────────

  async findAllSecurityLogs(companyId: string, dto: PaginationDto & {
    event?: SecurityEvent; userId?: string; date_from?: string; date_to?: string
  }) {
    const where: Prisma.SecurityLogWhereInput = {
      companyId,
      ...(dto.event   ? { event:  dto.event }  : {}),
      ...(dto.userId  ? { userId: dto.userId } : {}),
      ...(dto.date_from || dto.date_to ? {
        createdAt: {
          ...(dto.date_from ? { gte: new Date(dto.date_from) } : {}),
          ...(dto.date_to   ? { lte: new Date(dto.date_to) }   : {}),
        },
      } : {}),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.securityLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (dto.page-1)*dto.per_page, take: dto.per_page }),
      this.prisma.securityLog.count({ where }),
    ])
    return { data, meta: buildPaginationMeta(dto.page, dto.per_page, total) }
  }

  async writeSecurityLog(params: { companyId: string; userId?: string; event: SecurityEvent; ipAddress: string; userAgent?: string; metadata?: Record<string, unknown> }) {
    return this.prisma.securityLog.create({ data: params as any })
  }

  // ─── Sessions ─────────────────────────────────────────────

  async findAllSessions(companyId: string, dto: PaginationDto & { userId?: string }) {
    const where: Prisma.SessionWhereInput = {
      companyId,
      revokedAt:  null,
      expiresAt: { gt: new Date() },
      ...(dto.userId ? { userId: dto.userId } : {}),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.session.findMany({ where, orderBy: { createdAt: "desc" }, skip: (dto.page-1)*dto.per_page, take: dto.per_page,
        select: { id: true, userId: true, ipAddress: true, userAgent: true, expiresAt: true, createdAt: true }
      }),
      this.prisma.session.count({ where }),
    ])
    return { data, meta: buildPaginationMeta(dto.page, dto.per_page, total) }
  }

  async revokeSession(id: string, companyId: string) {
    const session = await this.prisma.session.findFirst({ where: { id, companyId, revokedAt: null } })
    if (!session) throw new NotFoundException(`Session ${id} not found`)
    await this.prisma.session.update({ where: { id }, data: { revokedAt: new Date() } })
  }

  async revokeAllSessions(userId: string, companyId: string) {
    await this.prisma.session.updateMany({ where: { userId, companyId, revokedAt: null }, data: { revokedAt: new Date() } })
  }
}
