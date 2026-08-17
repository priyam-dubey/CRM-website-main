import { IsOptional, IsString, IsUUID, IsISO8601, IsIn, IsBooleanString } from "class-validator"
import { BookingStatus } from "../../../shared/types/prisma.types"
import { PaginationDto } from "../../../common/dto/pagination.dto"

// passengerName/Email/Phone moved to the Passenger child table; searching by
// those now goes through a `passengers.some(...)` relation filter (see
// BookingsRepository.findMany) rather than a direct column match, so they
// stay valid search_field values from the caller's point of view even though
// the underlying query changed.
export type BookingSearchField = "reference" | "bidNumber" | "passengerName" | "customerEmail" | "pnr"

export class BookingFiltersDto extends PaginationDto {
  @IsOptional() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsOptional() @IsUUID() provider_id?: string
  @IsOptional() @IsUUID() assigned_to_id?: string
  @IsOptional() @IsUUID() created_by_id?: string

  @IsOptional() @IsISO8601() date_from?: string
  @IsOptional() @IsISO8601() date_to?: string

  @IsOptional() @IsString()
  search?: string

  // Find Bookings page: narrow `search` to one specific field instead of
  // matching across reference/bidNumber/passenger name/customerEmail/pnr.
  // Omit for the old across-all-fields behaviour.
  @IsOptional() @IsIn(["reference", "bidNumber", "passengerName", "customerEmail", "pnr"])
  search_field?: BookingSearchField

  @IsOptional() @IsBooleanString()
  is_urgent?: string
}
