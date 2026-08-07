import { IsInt, IsOptional, IsString, MaxLength, Min, Max } from "class-validator"
import { Type } from "class-transformer"

export class UpdateRevenueDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) grossAmount?: number
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999) netAmount?: number
  @IsOptional() @IsString() @MaxLength(500) description?: string
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) version?: number
}
