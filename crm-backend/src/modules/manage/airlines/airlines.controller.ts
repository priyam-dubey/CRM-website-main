import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, HttpCode, HttpStatus,
} from "@nestjs/common"
import { AirlinesService }   from "./airlines.service"
import { CreateAirlineDto }  from "./dto/create-airline.dto"
import { UpdateAirlineDto }  from "./dto/update-airline.dto"
import { AirlineFiltersDto } from "./dto/airline-filters.dto"
import { IdParamDto }        from "../../../common/dto/id-param.dto"
import { CurrentUser }       from "../../../common/decorators/current-user.decorator"
import { RequirePermission } from "../../../common/decorators/require-permission.decorator"
import type { JwtPayload }   from "../../../shared/types/request.types"
import { IsBoolean }         from "class-validator"
import { Transform }         from "class-transformer"

class ToggleActiveDto {
  @Transform(({ value }) => value === true || value === "true")
  @IsBoolean()
  isActive: boolean
}

@Controller("manage/airlines")
export class AirlinesController {
  constructor(private readonly airlinesService: AirlinesService) {}

  @Get()
  @RequirePermission("manage", "view")
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: AirlineFiltersDto) {
    return this.airlinesService.findAll(user.companyId, filters)
  }

  @Post()
  @RequirePermission("manage", "create")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAirlineDto) {
    return this.airlinesService.create(user.companyId, dto, user)
  }

  @Get(":id")
  @RequirePermission("manage", "view")
  findOne(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.airlinesService.findById(params.id, user.companyId)
  }

  @Patch(":id")
  @RequirePermission("manage", "edit")
  update(
    @Param() params: IdParamDto,
    @Body() dto: UpdateAirlineDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.airlinesService.update(params.id, user.companyId, dto, user)
  }

  @Patch(":id/toggle-active")
  @RequirePermission("manage", "edit")
  toggleActive(
    @Param() params: IdParamDto,
    @Body() dto: ToggleActiveDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.airlinesService.toggleActive(params.id, user.companyId, dto.isActive, user)
  }

  @Delete(":id")
  @RequirePermission("manage", "delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.airlinesService.remove(params.id, user.companyId, user)
  }
}
