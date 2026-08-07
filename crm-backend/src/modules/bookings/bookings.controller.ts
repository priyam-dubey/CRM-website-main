import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from "@nestjs/common"
import { BookingsService }    from "./bookings.service"
import { CreateBookingDto }   from "./dto/create-booking.dto"
import { UpdateBookingDto }   from "./dto/update-booking.dto"
import { BookingFiltersDto }  from "./dto/booking-filters.dto"
import { BulkIdsDto, BulkAssignDto } from "./dto/bulk-action.dto"
import { IdParamDto }         from "../../common/dto/id-param.dto"
import { CurrentUser }        from "../../common/decorators/current-user.decorator"
import { RequirePermission }  from "../../common/decorators/require-permission.decorator"
import type { JwtPayload }    from "../../shared/types/request.types"

@Controller("bookings")
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @RequirePermission("bookings", "view")
  findAll(@CurrentUser() user: JwtPayload, @Query() filters: BookingFiltersDto) {
    return this.bookingsService.findAll(user.companyId, filters)
  }

  @Post()
  @RequirePermission("bookings", "create")
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.companyId, dto, user)
  }

  @Post("bulk-delete")
  @RequirePermission("bookings", "delete")
  bulkDelete(@CurrentUser() user: JwtPayload, @Body() dto: BulkIdsDto) {
    return this.bookingsService.bulkDelete(dto, user.companyId, user)
  }

  @Post("bulk-assign")
  @RequirePermission("bookings", "edit")
  bulkAssign(@CurrentUser() user: JwtPayload, @Body() dto: BulkAssignDto) {
    return this.bookingsService.bulkAssign(dto, user.companyId, user)
  }

  @Get(":id")
  @RequirePermission("bookings", "view")
  findOne(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.findById(params.id, user.companyId)
  }

  @Patch(":id")
  @RequirePermission("bookings", "edit")
  update(@Param() params: IdParamDto, @Body() dto: UpdateBookingDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.update(params.id, user.companyId, dto, user)
  }

  @Post(":id/cancel")
  @RequirePermission("bookings", "edit")
  cancel(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.cancel(params.id, user.companyId, user)
  }

  @Delete(":id")
  @RequirePermission("bookings", "delete")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param() params: IdParamDto, @CurrentUser() user: JwtPayload) {
    return this.bookingsService.remove(params.id, user.companyId, user)
  }
}
