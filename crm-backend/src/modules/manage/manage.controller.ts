import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { ManageService }      from "./manage.service"
import { CurrentUser }        from "../../common/decorators/current-user.decorator"
import { RequirePermission }  from "../../common/decorators/require-permission.decorator"
import { PaginationDto }      from "../../common/dto/pagination.dto"
import { IdParamDto }         from "../../common/dto/id-param.dto"
import { IsString, MinLength, MaxLength, IsOptional, IsBoolean } from "class-validator"
import type { JwtPayload }    from "../../shared/types/request.types"

class CreateAirlineDto {
  @IsString() @MinLength(2) @MaxLength(200) name: string
  @IsString() @MinLength(2) @MaxLength(3)  iataCode: string
}

class NameDto {
  @IsString() @MinLength(2) @MaxLength(200) name: string
  @IsOptional() @IsString() @MaxLength(500) description?: string
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string
  @IsOptional() @IsString() @MaxLength(10)  shortCode?: string
  @IsOptional() @IsString() @MaxLength(30)  phone?: string
}

class UpdateNameDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string
  @IsOptional() @IsString() @MaxLength(500) description?: string
  @IsOptional() @IsBoolean() isActive?: boolean
  @IsOptional() @IsString() @MaxLength(500) logoUrl?: string
  @IsOptional() @IsString() @MaxLength(10)  shortCode?: string
  @IsOptional() @IsString() @MaxLength(30)  phone?: string
}

class CurrencyDto {
  @IsString() @MinLength(3) @MaxLength(3) code: string
  @IsString() @MinLength(2) @MaxLength(100) name: string
  @IsString() @MinLength(1) @MaxLength(5) symbol: string
  @IsOptional() decimalPlaces?: number
}

class UpdateCurrencyDto {
  @IsOptional() @IsString() @MaxLength(3) code?: string
  @IsOptional() @IsString() @MaxLength(100) name?: string
  @IsOptional() @IsString() @MaxLength(5) symbol?: string
  @IsOptional() decimalPlaces?: number
  @IsOptional() @IsBoolean() isActive?: boolean
}

@Controller("manage")
export class ManageController {
  constructor(private readonly manageService: ManageService) {}

  // Classes
  @Get("classes")      @RequirePermission("manage","view")
  getClasses(@CurrentUser() u: JwtPayload, @Query() dto: PaginationDto) { return this.manageService.findClasses(u.companyId, dto) }
  @Post("classes")     @RequirePermission("manage","create")
  createClass(@CurrentUser() u: JwtPayload, @Body() dto: NameDto) { return this.manageService.createClass(u.companyId, dto as any) }
  @Patch("classes/:id") @RequirePermission("manage","edit")
  updateClass(@Param() p: IdParamDto, @Body() dto: UpdateNameDto, @CurrentUser() u: JwtPayload) { return this.manageService.updateClass(p.id, u.companyId, dto as any) }
  @Delete("classes/:id") @RequirePermission("manage","delete") @HttpCode(HttpStatus.NO_CONTENT)
  deleteClass(@Param() p: IdParamDto, @CurrentUser() u: JwtPayload) { return this.manageService.deleteClass(p.id, u.companyId) }

  // Currencies
  @Get("currencies")   @RequirePermission("manage","view")
  getCurrencies(@Query() dto: PaginationDto) { return this.manageService.findCurrencies(dto) }
  @Post("currencies")  @RequirePermission("manage","create")
  createCurrency(@Body() dto: CurrencyDto) { return this.manageService.createCurrency(dto) }
  @Patch("currencies/:id") @RequirePermission("manage","edit")
  updateCurrency(@Param() p: IdParamDto, @Body() dto: UpdateCurrencyDto) { return this.manageService.updateCurrency(p.id, dto) }
  @Delete("currencies/:id") @RequirePermission("manage","delete") @HttpCode(HttpStatus.NO_CONTENT)
  deleteCurrency(@Param() p: IdParamDto) { return this.manageService.deleteCurrency(p.id) }

  // Providers
  @Get("providers")    @RequirePermission("manage","view")
  getProviders(@CurrentUser() u: JwtPayload, @Query() dto: PaginationDto) { return this.manageService.findProviders(u.companyId, dto) }
  @Post("providers")   @RequirePermission("manage","create")
  createProvider(@CurrentUser() u: JwtPayload, @Body() dto: NameDto) { return this.manageService.createProvider(u.companyId, { name: dto.name, logoUrl: dto.logoUrl }) }
  @Patch("providers/:id") @RequirePermission("manage","edit")
  updateProvider(@Param() p: IdParamDto, @Body() dto: UpdateNameDto, @CurrentUser() u: JwtPayload) { return this.manageService.updateProvider(p.id, u.companyId, dto as any) }
  @Delete("providers/:id") @RequirePermission("manage","delete") @HttpCode(HttpStatus.NO_CONTENT)
  deleteProvider(@Param() p: IdParamDto, @CurrentUser() u: JwtPayload) { return this.manageService.deleteProvider(p.id, u.companyId) }

  // Card Processors
  @Get("card-processors")   @RequirePermission("manage","view")
  getCardProcessors(@CurrentUser() u: JwtPayload, @Query() dto: PaginationDto) { return this.manageService.findCardProcessors(u.companyId, dto) }
  @Post("card-processors")  @RequirePermission("manage","create")
  createCardProcessor(@CurrentUser() u: JwtPayload, @Body() dto: NameDto) { return this.manageService.createCardProcessor(u.companyId, { name: dto.name, shortCode: dto.shortCode }) }
  @Patch("card-processors/:id") @RequirePermission("manage","edit")
  updateCardProcessor(@Param() p: IdParamDto, @Body() dto: UpdateNameDto, @CurrentUser() u: JwtPayload) { return this.manageService.updateCardProcessor(p.id, u.companyId, dto as any) }
  @Delete("card-processors/:id") @RequirePermission("manage","delete") @HttpCode(HttpStatus.NO_CONTENT)
  deleteCardProcessor(@Param() p: IdParamDto, @CurrentUser() u: JwtPayload) { return this.manageService.deleteCardProcessor(p.id, u.companyId) }

  // Call Queues
  @Get("call-queues")   @RequirePermission("manage","view")
  getCallQueues(@CurrentUser() u: JwtPayload, @Query() dto: PaginationDto) { return this.manageService.findCallQueues(u.companyId, dto) }
  @Post("call-queues")  @RequirePermission("manage","create")
  createCallQueue(@CurrentUser() u: JwtPayload, @Body() dto: NameDto) { return this.manageService.createCallQueue(u.companyId, dto) }
  @Patch("call-queues/:id") @RequirePermission("manage","edit")
  updateCallQueue(@Param() p: IdParamDto, @Body() dto: UpdateNameDto, @CurrentUser() u: JwtPayload) { return this.manageService.updateCallQueue(p.id, u.companyId, dto as any) }
  @Delete("call-queues/:id") @RequirePermission("manage","delete") @HttpCode(HttpStatus.NO_CONTENT)
  deleteCallQueue(@Param() p: IdParamDto, @CurrentUser() u: JwtPayload) { return this.manageService.deleteCallQueue(p.id, u.companyId) }
}
