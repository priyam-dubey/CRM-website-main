import { Controller, Get, Query } from "@nestjs/common"
import { ActivityService }   from "./activity.service"
import { CurrentUser }       from "../../common/decorators/current-user.decorator"
import { RequirePermission } from "../../common/decorators/require-permission.decorator"
import { CursorPaginationDto } from "../../common/dto/pagination.dto"
import { IsOptional, IsString, IsUUID } from "class-validator"
import type { JwtPayload } from "../../shared/types/request.types"
import type { ActivityAction } from "../../shared/types/prisma.types"

class ActivityFiltersDto extends CursorPaginationDto {
  @IsOptional() @IsString()  entityType?: string
  @IsOptional() @IsUUID()    actorId?: string
  @IsOptional() @IsString()  action?: ActivityAction
}

@Controller("activity")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @RequirePermission("activity", "view")
  findAll(@CurrentUser() user: JwtPayload, @Query() dto: ActivityFiltersDto) {
    return this.activityService.findAll(user.companyId, dto, {
      entityType: dto.entityType,
      actorId:    dto.actorId,
      action:     dto.action,
    })
  }

  @Get("me")
  findMine(@CurrentUser() user: JwtPayload, @Query() dto: CursorPaginationDto) {
    return this.activityService.findByActor(user.sub, user.companyId, dto)
  }
}
