import { Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
// Prisma import removed — using any for flexibility without generated client

interface ReferenceDto {
  name?: string; code?: string; iataCode?: string; description?: string
  isActive?: boolean; page: number; per_page: number
}

@Injectable()
export class ManageService {
  constructor(private readonly prisma: PrismaService) {}

  // Generic paginated finder for reference data
  private async paginate<T>(
    model: any,
    where: Record<string, unknown>,
    dto: { page: number; per_page: number },
  ) {
    const skip = (dto.page - 1) * dto.per_page
    const [data, total] = await this.prisma.$transaction([
      model.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: dto.per_page }),
      model.count({ where }),
    ])
    return { data, meta: buildPaginationMeta(dto.page, dto.per_page, total) }
  }

  // ─── Airlines are handled by AirlinesModule (see modules/manage/airlines) ─

  // ─── Classes ──────────────────────────────────────────────
  async findClasses(companyId: string, dto: { page: number; per_page: number }) {
    return this.paginate(this.prisma.bookingClass, { OR: [{ companyId }, { companyId: null }], deletedAt: null }, dto)
  }
  async createClass(companyId: string, data: { name: string; code: string }) {
    return this.prisma.bookingClass.create({ data: { ...data, companyId, isActive: true } })
  }
  async updateClass(id: string, companyId: string, data: Partial<{ name: string; code: string; isActive: boolean }>) {
    const item = await this.prisma.bookingClass.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Class not found")
    return this.prisma.bookingClass.update({ where: { id }, data })
  }
  async deleteClass(id: string, companyId: string) {
    const item = await this.prisma.bookingClass.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Class not found")
    await this.prisma.bookingClass.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  // ─── Currencies ───────────────────────────────────────────
  async findCurrencies(dto: { page: number; per_page: number }) {
    return this.paginate(this.prisma.currency, { isActive: true }, dto)
  }
  async createCurrency(data: { code: string; name: string; symbol: string; decimalPlaces?: number }) {
    return this.prisma.currency.create({ data: { ...data, decimalPlaces: data.decimalPlaces ?? 2, isActive: true } })
  }
  async updateCurrency(id: string, data: Partial<{ code: string; name: string; symbol: string; decimalPlaces: number; isActive: boolean }>) {
    const item = await this.prisma.currency.findUnique({ where: { id } })
    if (!item) throw new NotFoundException("Currency not found")
    return this.prisma.currency.update({ where: { id }, data })
  }
  async deleteCurrency(id: string) {
    const item = await this.prisma.currency.findUnique({ where: { id } })
    if (!item) throw new NotFoundException("Currency not found")
    // Currency has no soft-delete column; deactivate instead of a hard delete
    // so bookings/revenue referencing it (FK) are never orphaned.
    await this.prisma.currency.update({ where: { id }, data: { isActive: false } })
  }

  // ─── Providers ────────────────────────────────────────────
  async findProviders(companyId: string, dto: { page: number; per_page: number }) {
    return this.paginate(this.prisma.provider, { OR: [{ companyId }, { companyId: null }], deletedAt: null }, dto)
  }
  async createProvider(companyId: string, data: { name: string; logoUrl?: string }) {
    return this.prisma.provider.create({ data: { ...data, companyId, isActive: true } })
  }
  async updateProvider(id: string, companyId: string, data: Partial<{ name: string; isActive: boolean; logoUrl: string }>) {
    const item = await this.prisma.provider.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Provider not found")
    return this.prisma.provider.update({ where: { id }, data })
  }
  async deleteProvider(id: string, companyId: string) {
    const item = await this.prisma.provider.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Provider not found")
    await this.prisma.provider.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  // ─── Card Processors ──────────────────────────────────────
  async findCardProcessors(companyId: string, dto: { page: number; per_page: number }) {
    return this.paginate(this.prisma.cardProcessor, { OR: [{ companyId }, { companyId: null }], deletedAt: null }, dto)
  }
  async createCardProcessor(companyId: string, data: { name: string; shortCode?: string }) {
    return this.prisma.cardProcessor.create({ data: { ...data, companyId, isActive: true } })
  }
  async updateCardProcessor(id: string, companyId: string, data: Partial<{ name: string; isActive: boolean; shortCode: string }>) {
    const item = await this.prisma.cardProcessor.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Card processor not found")
    return this.prisma.cardProcessor.update({ where: { id }, data })
  }
  async deleteCardProcessor(id: string, companyId: string) {
    const item = await this.prisma.cardProcessor.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Card processor not found")
    await this.prisma.cardProcessor.update({ where: { id }, data: { deletedAt: new Date() } })
  }

  // ─── Call Queues ──────────────────────────────────────────
  async findCallQueues(companyId: string, dto: { page: number; per_page: number }) {
    return this.paginate(this.prisma.callQueue, { companyId, deletedAt: null }, dto)
  }
  async createCallQueue(companyId: string, data: { name: string; description?: string; phone?: string }) {
    return this.prisma.callQueue.create({ data: { ...data, companyId, isActive: true } })
  }
  async updateCallQueue(id: string, companyId: string, data: Partial<{ name: string; description: string; isActive: boolean; phone: string }>) {
    const item = await this.prisma.callQueue.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Call queue not found")
    return this.prisma.callQueue.update({ where: { id }, data })
  }
  async deleteCallQueue(id: string, companyId: string) {
    const item = await this.prisma.callQueue.findFirst({ where: { id, companyId, deletedAt: null } })
    if (!item) throw new NotFoundException("Call queue not found")
    await this.prisma.callQueue.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}
