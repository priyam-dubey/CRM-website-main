import { IsString, IsUUID, IsInt, IsOptional, IsISO8601, MaxLength, Min, Max, IsEmail, IsIn, IsNumber, IsBoolean } from "class-validator"
import { Type } from "class-transformer"
import { BookingStatus } from "../../../shared/types/prisma.types"

export class UpdateBookingDto {
  @IsOptional() @IsString() @MaxLength(200)
  passengerName?: string

  @IsOptional() @IsEmail() @MaxLength(320)
  passengerEmail?: string

  @IsOptional() @IsString() @MaxLength(30)
  passengerPhone?: string

  @IsOptional() @IsString() @MaxLength(20)
  pnr?: string

  @IsOptional() @IsString() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsOptional() @IsUUID() airlineId?: string
  @IsOptional() @IsUUID() classId?: string
  @IsOptional() @IsUUID() providerId?: string
  @IsOptional() @IsUUID() cardProcessorId?: string
  @IsOptional() @IsUUID() currencyId?: string
  @IsOptional() @IsUUID() callQueueId?: string
  @IsOptional() @IsUUID() assignedToId?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999)
  grossAmount?: number

  @IsOptional() @IsISO8601()
  travelDate?: string

  @IsOptional() @IsISO8601()
  returnDate?: string

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string

  @IsOptional() @IsBoolean()
  isUrgent?: boolean

  // Optimistic locking
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  version?: number
}
