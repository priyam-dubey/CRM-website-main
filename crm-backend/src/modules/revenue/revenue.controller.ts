import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus, Res } from "@nestjs/common"
import type { Response } from "express"
import { RevenueService }       from "./revenue.service"
import { CreateRevenueDto }     from "./dto/create-revenue.dto"
import { UpdateRevenueDto }     from "./dto/update-revenue.dto"
import { RevenueFiltersDto }    from "./dto/revenue-filters.dto"
import { RevenueDetailsFiltersDto } from "./dto/revenue-details-filters.dto"
import { CreateMcoDto }         from "./mco/dto/create-mco.dto"
import { CreateChargebackDto }  from "./chargebacks/dto/create-chargeback.dto"
import { CreateRefundDto }      from "./refunds/dto/create-refund.dto"
import { IdParamDto }           from "../../common/dto/id-param.dto"
import { PaginationDto }        from "../../common/dto/pagination.dto"
import { CurrentUser }          from "../../common/decorators/current-user.decorator"
import { RequirePermission }    from "../../common/decorators/require-permission.decorator"
import type { JwtPayload }      from "../../shared/types/request.types"
import { IsOptional, IsString, IsUUID } from "class-validator"

class DashboardQueryDto {
  @IsOptional() @IsUUID() currencyId?: string
  @IsOptional() @IsString() period?: string
  // New: matches the client's Today/Last 30 Days/This Month/Last 12 Months/This Year
  // preset selector, or an explicit custom range. Takes priority over `period`
  // when provided; `period` is kept for existing callers.
  @IsOptional() @IsString() range?: string
  @IsOptional() @IsString() date_from?: string
  @IsOptional() @IsString() date_to?: string
}

@Controller("revenue")
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  @RequirePermission("revenue", "view")
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: RevenueFiltersDto) {
    return this.revenueService.findAll(user.companyId, filters)
  }

  @Post()
  @RequirePermission("revenue", "create")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRevenueDto) {
    return this.revenueService.create(user.companyId, dto, user)
  }

  @Get("dashboard")
  @RequirePermission("revenue", "view")
  dashboard(@CurrentUser() user: JwtPayload, @Query() q: DashboardQueryDto) {
    return this.revenueService.getDashboard(user.companyId, q.currencyId, q.period, q.range, q.date_from, q.date_to)
  }

  @Get("details")
  @RequirePermission("revenue", "view")
  details(@CurrentUser() user: JwtPayload, @Query() filters: RevenueDetailsFiltersDto) {
    return this.revenueService.findRevenueDetails(user.companyId, filters)
  }

  @Get("details/export")
  @RequirePermission("revenue", "export")
  async detailsExport(@CurrentUser() user: JwtPayload, @Query() filters: RevenueDetailsFiltersDto, @Res() res: Response) {
    const csv = await this.revenueService.exportRevenueDetailsCsv(user.companyId, filters)
    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", `attachment; filename="revenue-details-${Date.now()}.csv"`)
    res.send(csv)
  }

  @Patch(":id")
  @RequirePermission("revenue", "edit")
  update(@Param() params: IdParamDto, @Body() dto: UpdateRevenueDto, @CurrentUser() user: JwtPayload) {
    return this.revenueService.update(params.id, user.companyId, dto)
  }

  @Delete(":id")
  @RequirePermission("revenue", "delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.revenueService.remove(params.id, user.companyId)
  }

  // MCOs
  @Get("mcos")
  @RequirePermission("revenue", "view")
  findAllMcos(@CurrentUser() user: JwtPayload, @Query() dto: PaginationDto) {
    return this.revenueService.findAllMcos(user.companyId, dto)
  }

  @Post("mcos")
  @RequirePermission("revenue", "manage")
  createMco(@CurrentUser() user: JwtPayload, @Body() dto: CreateMcoDto) {
    return this.revenueService.createMco(user.companyId, dto, user)
  }

  // Chargebacks
  @Get("chargebacks")
  @RequirePermission("revenue", "view")
  findAllChargebacks(@CurrentUser() user: JwtPayload, @Query() dto: PaginationDto) {
    return this.revenueService.findAllChargebacks(user.companyId, dto)
  }

  @Post("chargebacks")
  @RequirePermission("revenue", "manage")
  createChargeback(@CurrentUser() user: JwtPayload, @Body() dto: CreateChargebackDto) {
    return this.revenueService.createChargeback(user.companyId, dto, user)
  }

  // Refunds
  @Get("refunds")
  @RequirePermission("revenue", "view")
  findAllRefunds(@CurrentUser() user: JwtPayload, @Query() dto: PaginationDto) {
    return this.revenueService.findAllRefunds(user.companyId, dto)
  }

  @Post("refunds")
  @RequirePermission("revenue", "manage")
  createRefund(@CurrentUser() user: JwtPayload, @Body() dto: CreateRefundDto) {
    return this.revenueService.createRefund(user.companyId, dto, user)
  }
}
