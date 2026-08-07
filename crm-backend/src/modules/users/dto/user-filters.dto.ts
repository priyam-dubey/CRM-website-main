import { IsOptional, IsEnum, IsBoolean, IsString } from "class-validator"
import { UserRole } from "../../../shared/types/prisma.types"
import { PaginationDto } from "../../../common/dto/pagination.dto"

export class UserFiltersDto extends PaginationDto {
  @IsOptional() @IsEnum(UserRole)
  role?: UserRole

  @IsOptional() @IsBoolean()
  isActive?: boolean

  @IsOptional() @IsString()
  search?: string
}
