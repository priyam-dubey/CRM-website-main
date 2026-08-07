import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { QuickNotesService } from "./quick-notes.service"
import { CreateQuickNoteDto } from "./dto/create-quick-note.dto"
import { UpdateQuickNoteDto } from "./dto/update-quick-note.dto"
// import { PaginationDto }       from "../../common/dto/pagination.dto"
import { ListQuickNotesDto } from "./dto/list-quick-notes.dto";
import { IdParamDto } from "../../common/dto/id-param.dto"
import { CurrentUser } from "../../common/decorators/current-user.decorator"
import type { JwtPayload } from "../../shared/types/request.types"

// Quick Notes are a personal, page-agnostic scratchpad available to every
// authenticated role (Admin, Manager, Operator) — unlike most modules here,
// there is no @RequirePermission gate, the same choice already made for
// Notifications: this is a private-to-the-user resource, not an
// organizationally-permissioned one. Ownership is still enforced at the
// service layer (see QuickNotesService.findOwned).
@Controller("quick-notes")
export class QuickNotesController {
  constructor(private readonly quickNotesService: QuickNotesService) { }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() dto: ListQuickNotesDto,
  ) {
    return this.quickNotesService.findAll(
      user,
      dto,
      dto.userId,
    );
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuickNoteDto) {
    return this.quickNotesService.create(dto, user)
  }

  @Patch(":id")
  update(@Param() params: IdParamDto, @Body() dto: UpdateQuickNoteDto, @CurrentUser() user: JwtPayload) {
    return this.quickNotesService.update(params.id, dto, user)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.quickNotesService.remove(params.id, user)
  }
}
