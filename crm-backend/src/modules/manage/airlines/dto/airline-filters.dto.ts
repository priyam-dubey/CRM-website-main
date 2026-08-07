import { IsOptional, IsString, IsBoolean } from "class-validator"
import { Transform } from "class-transformer"
import { PaginationDto } from "../../../../common/dto/pagination.dto"

export class AirlineFiltersDto extends PaginationDto {
  @IsOptional() @IsString()
  search?: string

  @IsOptional() @Transform(({ value }) => value === "true")
  @IsBoolean()
  isActive?: boolean

  @IsOptional() @IsString()
  country?: string
}
