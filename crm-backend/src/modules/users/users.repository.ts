import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../database/prisma.service"
import { getPaginationSkip } from "../../shared/utils/pagination.util"
import type { UserFiltersDto }  from "./dto/user-filters.dto"
import type { CreateUserDto }   from "./dto/create-user.dto"
import type { Prisma }          from "../../shared/types/prisma.types"

const PUBLIC_SELECT = {
  id: true, companyId: true, email: true, firstName: true, lastName: true,
  role: true, isActive: true, lastLoginAt: true, version: true,
  createdAt: true, updatedAt: true,
} as const

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: UserFiltersDto) {
    const where: Prisma.UserWhereInput = {
      companyId,
      deletedAt: null,
      ...(filters.role     ? { role:     filters.role }     : {}),
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.search   ? {
        OR: [
          { firstName: { contains: filters.search, mode: "insensitive" } },
          { lastName:  { contains: filters.search, mode: "insensitive" } },
          { email:     { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
    }

    const orderBy: Prisma.UserOrderByWithRelationInput =
      filters.sort_by ? { [filters.sort_by]: filters.sort_dir ?? "desc" } : { createdAt: "desc" }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select:  PUBLIC_SELECT,
        orderBy,
        skip:    getPaginationSkip(filters.page, filters.per_page),
        take:    filters.per_page,
      }),
      this.prisma.user.count({ where }),
    ])

    return [users, total] as const
  }

  async findById(id: string, companyId: string) {
    return this.prisma.user.findFirst({
      where:  { id, companyId, deletedAt: null },
      select: PUBLIC_SELECT,
    })
  }

  async findByEmail(email: string, companyId: string) {
    return this.prisma.user.findFirst({
      where: { email, companyId, deletedAt: null },
    })
  }

  async create(data: Prisma.UserCreateInput) {
    const user = await this.prisma.user.create({ data, select: PUBLIC_SELECT })
    return user
  }

  async update(id: string, companyId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where:  { id },
      data:   { ...data, companyId },
      select: PUBLIC_SELECT,
    })
  }

  async softDelete(id: string, companyId: string) {
    await this.prisma.user.updateMany({
      where: { id, companyId },
      data:  { deletedAt: new Date(), isActive: false },
    })
    // Revoke all sessions
    await this.prisma.session.updateMany({
      where: { userId: id },
      data:  { revokedAt: new Date() },
    })
  }
}
