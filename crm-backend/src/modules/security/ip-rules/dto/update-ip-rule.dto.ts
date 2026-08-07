import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator"
import { IPRuleType } from "../../../../shared/types/prisma.types"

export class UpdateIpRuleDto {
  @IsOptional() @IsEnum(IPRuleType) type?: IPRuleType
  @IsOptional() @IsString() @MaxLength(300) description?: string
}
