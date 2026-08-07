import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common"
import { QuickNotesRepository } from "./quick-notes.repository"
import { ActivityService } from "../activity/activity.service"
import { buildPaginationMeta } from "../../shared/utils/pagination.util"
import type { CreateQuickNoteDto } from "./dto/create-quick-note.dto"
import type { UpdateQuickNoteDto } from "./dto/update-quick-note.dto"
import type { PaginationDto } from "../../common/dto/pagination.dto"
import type { JwtPayload } from "../../shared/types/request.types"

@Injectable()
export class QuickNotesService {
  constructor(
    private readonly repo:     QuickNotesRepository,
    private readonly activity: ActivityService,
  ) {}

  async findAll(actor: JwtPayload, pagination: PaginationDto, targetUserId?: string) {
    // Debug: determine which userId is being queried
    const userId = (actor.role === 'ADMIN' && targetUserId) ? targetUserId : actor.sub;
    console.log('QuickNotesService.findAll - actor.sub:', actor.sub, 'role:', actor.role, 'targetUserId:', targetUserId, 'effectiveUserId:', userId);
    const [notes, total] = await this.repo.findMany(userId, actor.companyId, pagination, targetUserId);
    console.log('QuickNotesService.findAll - notes fetched:', notes.length, 'total:', total);
    return {
      data: notes,
      meta: buildPaginationMeta(pagination.page, pagination.per_page, total),
    };
  }

  async create(dto: CreateQuickNoteDto, actor: JwtPayload) {
    const note = await this.repo.create(actor.companyId, actor.sub, dto.note)

    this.activity.write({
      companyId:     actor.companyId,
      actorId:       actor.sub,
      actorName:     `${actor.sub}`,
      action:        "CREATE" as any,
      entityType:    "QuickNote",
      entityId:      note.id,
      afterSnapshot: { noteLength: dto.note.length },
    })

    return note
  }

  async update(id: string, dto: UpdateQuickNoteDto, actor: JwtPayload) {
    const existing = await this.findOwned(id, actor)

    const updated = await this.repo.update(id, dto.note)

    this.activity.write({
      companyId:      actor.companyId,
      actorId:        actor.sub,
      actorName:      `${actor.sub}`,
      action:         "UPDATE" as any,
      entityType:     "QuickNote",
      entityId:       id,
      beforeSnapshot: { note: existing.note },
      afterSnapshot:  { note: dto.note },
    })

    return updated
  }

  async remove(id: string, actor: JwtPayload) {
    const existing = await this.findOwned(id, actor)

    await this.repo.softDelete(id)

    this.activity.write({
      companyId:      actor.companyId,
      actorId:        actor.sub,
      actorName:      `${actor.sub}`,
      action:         "DELETE" as any,
      entityType:     "QuickNote",
      entityId:       id,
      beforeSnapshot: { note: existing.note },
    })
  }

  /**
   * Quick Notes are a personal scratchpad, not a shared team record like
   * BookingNote — so ownership is strict: only the user who created a note
   * may view, edit, or delete it, regardless of role. Even Admins cannot
   * read another user's Quick Notes.
   */
  private async findOwned(id: string, actor: JwtPayload) {
    const existing = await this.repo.findById(id)
    if (!existing) throw new NotFoundException(`Quick note ${id} not found`)
    if (existing.userId !== actor.sub) {
      throw new ForbiddenException("You can only manage your own quick notes")
    }
    return existing
  }
}
