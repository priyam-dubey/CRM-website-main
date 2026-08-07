import { IsString, IsUUID, IsInt, IsOptional, IsISO8601, MinLength, MaxLength, Min, Max, IsEmail, IsIn, IsBoolean } from "class-validator"
import { Type } from "class-transformer"
import { BookingStatus, TransactionType } from "../../../shared/types/prisma.types"

export class CreateBookingDto {
  @IsString() @MinLength(2) @MaxLength(200)
  passengerName: string

  @IsOptional() @IsEmail() @MaxLength(320)
  passengerEmail?: string

  @IsOptional() @IsString() @MaxLength(30)
  passengerPhone?: string

  @IsString() @MinLength(5) @MaxLength(20)
  pnr: string

  @IsOptional() @IsString() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsUUID() airlineId: string
  @IsUUID() classId: string
  @IsUUID() providerId: string
  @IsUUID() cardProcessorId: string
  @IsUUID() currencyId: string

  @IsOptional() @IsUUID()
  callQueueId?: string

  @IsOptional() @IsUUID()
  assignedToId?: string

  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999)
  grossAmount: number

  @IsISO8601()
  travelDate: string

  @IsOptional() @IsISO8601()
  returnDate?: string

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string

  // Which of the 9 transaction types this booking's Transaction #1 represents.
  // Defaults to NEW_BOOKING in the service when omitted (existing callers).
  @IsOptional() @IsString() @IsIn(Object.values(TransactionType))
  transactionType?: TransactionType

  @IsOptional() @IsBoolean()
  isUrgent?: boolean
}
