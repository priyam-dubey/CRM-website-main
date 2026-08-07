import { IsEmail, IsEnum, IsString, MaxLength, MinLength, IsOptional, IsBoolean } from "class-validator"
import { UserRole } from "../../../shared/types/prisma.types"

export class UpdateUserDto {
  @IsOptional() @IsEmail() @MaxLength(320)
  email?: string

  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  firstName?: string

  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  lastName?: string

  @IsOptional() @IsEnum(UserRole)
  role?: UserRole

  @IsOptional() @IsString() @MinLength(8) @MaxLength(72)
  password?: string

  @IsOptional() @IsBoolean()
  isActive?: boolean
}
