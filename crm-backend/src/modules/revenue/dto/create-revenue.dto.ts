import { IsUUID, IsInt, IsEnum, IsOptional, IsString, MaxLength, Min, Max, IsISO8601 } from "class-validator"
import { Type } from "class-transformer"
import { RevenueType } from "../../../shared/types/prisma.types"

export class CreateRevenueDto {
  @IsUUID() bookingId: string
  @IsUUID() currencyId: string
  @IsEnum(RevenueType) type: RevenueType
  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) grossAmount: number
  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) netAmount: number
  @IsOptional() @IsString() @MaxLength(500) description?: string
  @IsOptional() @IsISO8601() entryDate?: string
}
