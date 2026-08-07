import { IsOptional, IsString, IsUUID, IsISO8601, IsIn, IsBooleanString } from "class-validator"
import { BookingStatus } from "../../../shared/types/prisma.types"
import { PaginationDto } from "../../../common/dto/pagination.dto"

export type BookingSearchField = "reference" | "passengerName" | "passengerEmail" | "passengerPhone" | "pnr"

export class BookingFiltersDto extends PaginationDto {
  @IsOptional() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsOptional() @IsUUID() airline_id?: string
  @IsOptional() @IsUUID() provider_id?: string
  @IsOptional() @IsUUID() card_processor_id?: string
  @IsOptional() @IsUUID() assigned_to_id?: string
  @IsOptional() @IsUUID() created_by_id?: string

  @IsOptional() @IsISO8601() date_from?: string
  @IsOptional() @IsISO8601() date_to?: string

  @IsOptional() @IsString()
  search?: string

  // Find Bookings page: narrow `search` to one specific field instead of
  // matching across passengerName/reference/pnr. Omit for the old
  // across-all-fields behaviour (existing callers keep working unchanged).
  @IsOptional() @IsIn(["reference", "passengerName", "passengerEmail", "passengerPhone", "pnr"])
  search_field?: BookingSearchField

  @IsOptional() @IsBooleanString()
  is_urgent?: string
}
