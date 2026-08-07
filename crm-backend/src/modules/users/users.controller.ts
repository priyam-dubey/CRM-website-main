import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { UsersService }         from "./users.service"
import { CreateUserDto }        from "./dto/create-user.dto"
import { UpdateUserDto }        from "./dto/update-user.dto"
import { UserFiltersDto }       from "./dto/user-filters.dto"
import { IdParamDto }           from "../../common/dto/id-param.dto"
import { CurrentUser }          from "../../common/decorators/current-user.decorator"
import { RequirePermission }    from "../../common/decorators/require-permission.decorator"
import type { JwtPayload }      from "../../shared/types/request.types"

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission("users", "view")
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: UserFiltersDto) {
    return this.usersService.findAll(user.companyId, filters)
  }

  @Get("me")
  findMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findMe(user)
  }

  @Post()
  @RequirePermission("users", "create")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateUserDto) {
    return this.usersService.create(user.companyId, dto)
  }

  @Get(":id")
  @RequirePermission("users", "view")
  findOne(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.findById(params.id, user.companyId)
  }

  @Patch(":id")
  update(@Param() params: IdParamDto, @Body() dto: UpdateUserDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.update(params.id, user.companyId, dto, user)
  }

  @Delete(":id")
  @RequirePermission("users", "delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(params.id, user.companyId, user)
  }
}
