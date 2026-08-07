import { Injectable } from "@nestjs/common"
import { PrismaService } from "../../../database/prisma.service"
import { getPaginationSkip, buildPaginationMeta } from "../../../shared/utils/pagination.util"
import type { AirlineFiltersDto } from "./dto/airline-filters.dto"
import type { CreateAirlineDto }  from "./dto/create-airline.dto"
import type { UpdateAirlineDto }  from "./dto/update-airline.dto"

@Injectable()
export class AirlinesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(companyId: string, filters: AirlineFiltersDto) {
    const where: any = {
      OR: [{ companyId }, { companyId: null }],
      deletedAt: null,
      ...(filters.isActive !== undefined ? { isActive: filters.isActive } : {}),
      ...(filters.country ? { country: { contains: filters.country, mode: "insensitive" } } : {}),
      ...(filters.search ? {
        OR: [
          { airlineName: { contains: filters.search, mode: "insensitive" } },
          { iataCode:    { contains: filters.search, mode: "insensitive" } },
          { icaoCode:    { contains: filters.search, mode: "insensitive" } },
          { country:     { contains: filters.search, mode: "insensitive" } },
        ],
      } : {}),
    }

    const orderBy: any = filters.sort_by
      ? { [filters.sort_by]: filters.sort_dir ?? "asc" }
      : { airlineName: "asc" }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.airline.findMany({
        where, orderBy,
        skip: getPaginationSkip(filters.page, filters.per_page),
        take: filters.per_page,
      }),
      this.prisma.airline.count({ where }),
    ])

    return { data, meta: buildPaginationMeta(filters.page, filters.per_page, total) }
  }

  async findById(id: string, companyId: string) {
    return this.prisma.airline.findFirst({
      where: { id, deletedAt: null, OR: [{ companyId }, { companyId: null }] },
    })
  }

  async findByIataCode(iataCode: string, companyId: string) {
    return this.prisma.airline.findFirst({
      where: { iataCode, deletedAt: null, OR: [{ companyId }, { companyId: null }] },
    })
  }

  async create(companyId: string, dto: CreateAirlineDto) {
    return this.prisma.airline.create({
      data: {
        companyId,
        airlineName: dto.airlineName,
        iataCode:    dto.iataCode,
        icaoCode:    dto.icaoCode,
        country:     dto.country,
        logoUrl:     dto.logoUrl,
        isActive:    true,
      },
    })
  }

  async update(id: string, dto: UpdateAirlineDto) {
    return this.prisma.airline.update({ where: { id }, data: dto })
  }

  async softDelete(id: string) {
    await this.prisma.airline.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    })
  }

  async toggleActive(id: string, isActive: boolean) {
    return this.prisma.airline.update({ where: { id }, data: { isActive } })
  }
}
