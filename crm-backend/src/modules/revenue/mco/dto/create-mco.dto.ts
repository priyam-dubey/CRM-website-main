import { IsUUID, IsInt, IsOptional, IsString, MaxLength, Min, Max, IsISO8601 } from "class-validator"
import { Type } from "class-transformer"

export class CreateMcoDto {
  @IsUUID() bookingId: string
  @IsUUID() airlineId: string
  @IsUUID() currencyId: string
  @IsString() @MaxLength(50) mcoNumber: string
  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) amount: number
  @IsISO8601() issuedAt: string
  @IsOptional() @IsString() @MaxLength(500) reason?: string
}
