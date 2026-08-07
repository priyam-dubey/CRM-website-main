import { IsUUID, IsInt, IsOptional, IsString, MaxLength, Min, Max } from "class-validator"
import { Type } from "class-transformer"

export class CreateChargebackDto {
  @IsUUID() bookingId: string
  @IsUUID() cardProcessorId: string
  @IsUUID() currencyId: string
  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) amount: number
  @IsOptional() @IsString() @MaxLength(500) reason?: string
}
