import { IsEmail, IsEnum, IsString, MaxLength, MinLength, IsOptional, IsBoolean } from "class-validator"
import { UserRole } from "../../../shared/types/prisma.types"

export class CreateUserDto {
  @IsEmail() @MaxLength(320)
  email: string

  @IsString() @MinLength(2) @MaxLength(100)
  firstName: string

  @IsString() @MinLength(2) @MaxLength(100)
  lastName: string

  @IsEnum(UserRole)
  role: UserRole

  @IsString() @MinLength(8) @MaxLength(72)
  password: string

  @IsOptional() @IsBoolean()
  isActive?: boolean
}
