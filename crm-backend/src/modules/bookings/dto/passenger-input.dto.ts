import { IsInt, Min, IsIn, IsString, MinLength, MaxLength, IsOptional, IsISO8601 } from "class-validator"
import { Type } from "class-transformer"
import { PassengerType } from "../../../shared/types/prisma.types"

export class PassengerInputDto {
  @Type(() => Number) @IsInt() @Min(1)
  passengerNumber: number

  @IsIn(Object.values(PassengerType))
  type: PassengerType

  @IsString() @MinLength(1) @MaxLength(100)
  firstName: string

  @IsOptional() @IsString() @MaxLength(100)
  middleName?: string

  @IsString() @MinLength(1) @MaxLength(100)
  lastName: string

  @IsOptional() @IsISO8601()
  dob?: string

  @IsOptional() @IsString() @MaxLength(50)
  ticketNumber?: string
}
