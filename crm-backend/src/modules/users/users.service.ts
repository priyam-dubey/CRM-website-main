import { Injectable, NotFoundException, ConflictException, ForbiddenException } from "@nestjs/common"
import { UsersRepository }  from "./users.repository"
import { hashPassword }     from "../../shared/utils/hash.util"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import { ROLE_PERMISSIONS } from "../../shared/constants/permissions.constants"
import type { CreateUserDto }  from "./dto/create-user.dto"
import type { UpdateUserDto }  from "./dto/update-user.dto"
import type { UserFiltersDto } from "./dto/user-filters.dto"
import type { JwtPayload }     from "../../shared/types/request.types"

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async findAll(companyId: string, filters: UserFiltersDto) {
    const [users, total] = await this.repo.findMany(companyId, filters)
    return {
      data: users,
      meta: buildPaginationMeta(filters.page, filters.per_page, total),
    }
  }

  async findById(id: string, companyId: string) {
    const user = await this.repo.findById(id, companyId)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    return user
  }

  async findMe(requestUser: JwtPayload) {
    const user = await this.findById(requestUser.sub, requestUser.companyId)
    const permissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] ?? {}
    return { ...user, permissions }
  }

  async create(companyId: string, dto: CreateUserDto) {
    const existing = await this.repo.findByEmail(dto.email, companyId)
    if (existing) throw new ConflictException("A user with this email already exists")

    const passwordHash = await hashPassword(dto.password)
    return this.repo.create({
      company:      { connect: { id: companyId } },
      email:        dto.email,
      passwordHash,
      firstName:    dto.firstName,
      lastName:     dto.lastName,
      role:         dto.role,
      isActive:     dto.isActive ?? true,
    })
  }

  async update(id: string, companyId: string, dto: UpdateUserDto, requestUser: JwtPayload) {
    const target = await this.repo.findById(id, companyId)
    if (!target) throw new NotFoundException(`User ${id} not found`)

    // Operators and Managers can only edit themselves
    if (requestUser.role !== "ADMIN" && requestUser.sub !== id) {
      throw new ForbiddenException("You can only update your own profile")
    }

    // Only Admins can change roles
    if (dto.role && requestUser.role !== "ADMIN") {
      throw new ForbiddenException("Only admins can change user roles")
    }

    const updateData: any = { ...dto }
    if (dto.password) {
      updateData.passwordHash = await hashPassword(dto.password)
      delete updateData.password
    }

    return this.repo.update(id, companyId, updateData)
  }

  async remove(id: string, companyId: string, requestUser: JwtPayload) {
    if (requestUser.sub === id) throw new ForbiddenException("Cannot delete your own account")
    const user = await this.repo.findById(id, companyId)
    if (!user) throw new NotFoundException(`User ${id} not found`)
    await this.repo.softDelete(id, companyId)
  }
}
