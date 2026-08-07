import { Controller, Get, Patch, Delete, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { NotificationsService } from "./notifications.service"
import { CurrentUser }          from "../../common/decorators/current-user.decorator"
import { PaginationDto }        from "../../common/dto/pagination.dto"
import { IdParamDto }           from "../../common/dto/id-param.dto"
import type { JwtPayload }      from "../../shared/types/request.types"

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() dto: PaginationDto) {
    return this.notificationsService.findAll(user.sub, user.companyId, dto)
  }

  @Patch(":id/read")
  markRead(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.markRead(params.id, user.sub)
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: JwtPayload) {
    return this.notificationsService.markAllRead(user.sub, user.companyId)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  dismiss(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.notificationsService.dismiss(params.id, user.sub)
  }
}
