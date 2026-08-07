import { IsOptional, IsUUID, IsISO8601, IsEnum } from "class-validator"
import { RevenueType } from "../../../shared/types/prisma.types"
import { PaginationDto } from "../../../common/dto/pagination.dto"

export class RevenueFiltersDto extends PaginationDto {
  @IsOptional() @IsUUID() booking_id?: string
  @IsOptional() @IsUUID() currency_id?: string
  @IsOptional() @IsEnum(RevenueType) type?: RevenueType
  @IsOptional() @IsISO8601() date_from?: string
  @IsOptional() @IsISO8601() date_to?: string
}
