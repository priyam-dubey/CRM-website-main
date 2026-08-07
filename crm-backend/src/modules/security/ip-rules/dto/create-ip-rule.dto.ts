import { IsEnum, IsOptional, IsString, MaxLength, Matches } from "class-validator"
import { IPRuleType } from "../../../../shared/types/prisma.types"

export class CreateIpRuleDto {
  @IsEnum(IPRuleType) type: IPRuleType

  @IsString()
  @Matches(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/, { message: "Invalid IPv4 CIDR format" })
  cidr: string

  @IsOptional() @IsString() @MaxLength(300)
  description?: string
}
