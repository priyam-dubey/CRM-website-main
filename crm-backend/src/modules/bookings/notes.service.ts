import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { NotesRepository } from "./notes.repository"
import { ActivityService } from "../activity/activity.service"
import type { CreateNoteDto } from "./dto/create-note.dto"
import type { UpdateNoteDto } from "./dto/update-note.dto"
import type { JwtPayload }   from "../../shared/types/request.types"

@Injectable()
export class NotesService {
  constructor(
    private readonly repo:     NotesRepository,
    private readonly activity: ActivityService,
  ) {}

  async findByBooking(bookingId: string) {
    return this.repo.findByBooking(bookingId)
  }

  async create(bookingId: string, dto: CreateNoteDto, actor: JwtPayload) {
    const note = await this.repo.create(bookingId, actor.sub, dto.note)

    this.activity.write({
      companyId:    actor.companyId,
      actorId:      actor.sub,
      actorName:    `${actor.sub}`,
      action:       "CREATE" as any,
      entityType:   "BookingNote",
      entityId:     note.id,
      entityLabel:  `Note on booking ${bookingId}`,
      afterSnapshot: { bookingId, noteLength: dto.note.length },
    })

    return note
  }

  async update(id: string, dto: UpdateNoteDto, actor: JwtPayload) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundException(`Note ${id} not found`)

    // Operators cannot edit (only Managers and Admins can)
    // Managers can edit any note; Admins can edit any note
    if (actor.role === "OPERATOR") {
      throw new ForbiddenException("Operators cannot edit notes")
    }

    const updated = await this.repo.update(id, dto.note)

    this.activity.write({
      companyId:    actor.companyId,
      actorId:      actor.sub,
      actorName:    `${actor.sub}`,
      action:       "UPDATE" as any,
      entityType:   "BookingNote",
      entityId:     id,
      beforeSnapshot: { note: (existing as any).note },
      afterSnapshot:  { note: dto.note },
    })

    return updated
  }

  async remove(id: string, actor: JwtPayload) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundException(`Note ${id} not found`)

    // Operators cannot delete
    if (actor.role === "OPERATOR") {
      throw new ForbiddenException("Operators cannot delete notes")
    }

    await this.repo.softDelete(id)

    this.activity.write({
      companyId:     actor.companyId,
      actorId:       actor.sub,
      actorName:     `${actor.sub}`,
      action:        "DELETE" as any,
      entityType:    "BookingNote",
      entityId:      id,
      beforeSnapshot: { note: (existing as any).note },
    })
  }
}
