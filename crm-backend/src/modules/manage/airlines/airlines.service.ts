import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { AirlinesRepository } from "./airlines.repository"
import { ActivityService }    from "../../activity/activity.service"
import { sanitiseSnapshot }   from "../../../shared/utils/diff.util"
import type { CreateAirlineDto } from "./dto/create-airline.dto"
import type { UpdateAirlineDto } from "./dto/update-airline.dto"
import type { AirlineFiltersDto } from "./dto/airline-filters.dto"
import type { JwtPayload }       from "../../../shared/types/request.types"

@Injectable()
export class AirlinesService {
  constructor(
    private readonly repo:     AirlinesRepository,
    private readonly activity: ActivityService,
  ) {}

  async findAll(companyId: string, filters: AirlineFiltersDto) {
    return this.repo.findMany(companyId, filters)
  }

  async findById(id: string, companyId: string) {
    const airline = await this.repo.findById(id, companyId)
    if (!airline) throw new NotFoundException(`Airline ${id} not found`)
    return airline
  }

  async create(companyId: string, dto: CreateAirlineDto, actor: JwtPayload) {
    // Enforce unique IATA within company scope
    const existing = await this.repo.findByIataCode(dto.iataCode, companyId)
    if (existing) throw new ConflictException(`Airline with IATA code ${dto.iataCode} already exists`)

    const airline = await this.repo.create(companyId, dto)

    this.activity.write({
      companyId,
      actorId:      actor.sub,
      actorName:    `${actor.sub}`,
      action:       "CREATE" as any,
      entityType:   "Airline",
      entityId:     airline.id,
      entityLabel:  `${airline.airlineName} (${airline.iataCode})`,
      afterSnapshot: sanitiseSnapshot(airline as any),
    })

    return airline
  }

  async update(id: string, companyId: string, dto: UpdateAirlineDto, actor: JwtPayload) {
    const existing = await this.findById(id, companyId)

    // Check IATA conflict if changing code
    if (dto.iataCode && dto.iataCode !== (existing as any).iataCode) {
      const conflict = await this.repo.findByIataCode(dto.iataCode, companyId)
      if (conflict && conflict.id !== id) {
        throw new ConflictException(`Airline with IATA code ${dto.iataCode} already exists`)
      }
    }

    const before = sanitiseSnapshot(existing as any)
    const updated = await this.repo.update(id, dto)

    this.activity.write({
      companyId,
      actorId:       actor.sub,
      actorName:     `${actor.sub}`,
      action:        "UPDATE" as any,
      entityType:    "Airline",
      entityId:      id,
      entityLabel:   `${(updated as any).airlineName} (${(updated as any).iataCode})`,
      beforeSnapshot: before,
      afterSnapshot:  sanitiseSnapshot(updated as any),
    })

    return updated
  }

  async toggleActive(id: string, companyId: string, isActive: boolean, actor: JwtPayload) {
    const existing = await this.findById(id, companyId)
    const updated  = await this.repo.toggleActive(id, isActive)

    this.activity.write({
      companyId,
      actorId:    actor.sub,
      actorName:  `${actor.sub}`,
      action:     "UPDATE",
      entityType: "Airline",
      entityId:   id,
      entityLabel: `${(existing as any).airlineName} (${(existing as any).iataCode})`,
      beforeSnapshot: { isActive: (existing as any).isActive },
      afterSnapshot:  { isActive },
    })

    return updated
  }

  async remove(id: string, companyId: string, actor: JwtPayload) {
    const existing = await this.findById(id, companyId)

    await this.repo.softDelete(id)

    this.activity.write({
      companyId,
      actorId:       actor.sub,
      actorName:     `${actor.sub}`,
      action:        "DELETE" as any,
      entityType:    "Airline",
      entityId:      id,
      entityLabel:   `${(existing as any).airlineName} (${(existing as any).iataCode})`,
      beforeSnapshot: sanitiseSnapshot(existing as any),
    })
  }
}
