import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, HttpCode, HttpStatus,
} from "@nestjs/common"
import { NotesService }      from "./notes.service"
import { CreateNoteDto }     from "./dto/create-note.dto"
import { UpdateNoteDto }     from "./dto/update-note.dto"
import { IdParamDto }        from "../../common/dto/id-param.dto"
import { CurrentUser }       from "../../common/decorators/current-user.decorator"
import { RequirePermission } from "../../common/decorators/require-permission.decorator"
import type { JwtPayload }   from "../../shared/types/request.types"

class BookingIdParam {
  bookingId: string
}

@Controller()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get("bookings/:bookingId/notes")
  @RequirePermission("bookings", "view")
  findAll(@Param("bookingId") bookingId: string) {
    return this.notesService.findByBooking(bookingId)
  }

  @Post("bookings/:bookingId/notes")
  @RequirePermission("bookings", "view")  // All authenticated roles can create notes
  create(
    @Param("bookingId") bookingId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.create(bookingId, dto, user)
  }

  @Patch("notes/:id")
  @RequirePermission("bookings", "edit")
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.notesService.update(params.id, dto, user)
  }

  @Delete("notes/:id")
  @RequirePermission("bookings", "edit")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.notesService.remove(params.id, user)
  }
}
