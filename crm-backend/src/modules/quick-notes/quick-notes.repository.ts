import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { getPaginationSkip } from "../../shared/utils/pagination.util"
import type { PaginationDto } from "../../common/dto/pagination.dto"

const QUICK_NOTE_SELECT = {
  id:        true,
  companyId: true,
  userId:    true,
  note:      true,
  createdAt: true,
  updatedAt: true,
} as const

@Injectable()
export class QuickNotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(userId: string, companyId: string, pagination: PaginationDto, targetUserId?: string) {
    const effectiveUserId = targetUserId ?? userId;
    const where = { userId: effectiveUserId, companyId, deletedAt: null };

    const [notes, total] = await this.prisma.$transaction([
      this.prisma.quickNote.findMany({
        where,
        select: QUICK_NOTE_SELECT,
        orderBy: { createdAt: "desc" },
        skip: getPaginationSkip(pagination.page, pagination.per_page),
        take: pagination.per_page,
      }),
      this.prisma.quickNote.count({ where }),
    ]);

    return [notes, total] as const;
  }

  async findById(id: string) {
    return this.prisma.quickNote.findFirst({
      where:  { id, deletedAt: null },
      select: { ...QUICK_NOTE_SELECT, userId: true },
    })
  }

  async create(companyId: string, userId: string, note: string) {
    return this.prisma.quickNote.create({
      data:   { companyId, userId, note },
      select: QUICK_NOTE_SELECT,
    })
  }

  async update(id: string, note: string) {
    return this.prisma.quickNote.update({
      where:  { id },
      data:   { note },
      select: QUICK_NOTE_SELECT,
    })
  }

  async softDelete(id: string) {
    await this.prisma.quickNote.update({
      where: { id },
      data:  { deletedAt: new Date() },
    })
  }
}
