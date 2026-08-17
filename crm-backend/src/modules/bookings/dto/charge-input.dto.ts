import { IsInt, Min, Max, IsUUID, IsOptional, IsString, MaxLength } from "class-validator"
import { Type } from "class-transformer"

export class ChargeInputDto {
  @Type(() => Number) @IsInt() @Min(1)
  chargeNumber: number

  @Type(() => Number) @IsInt() @Min(1) @Max(999_999_999)
  amount: number

  @IsUUID()
  currencyId: string

  @IsOptional() @IsString() @MaxLength(500)
  description?: string
}
