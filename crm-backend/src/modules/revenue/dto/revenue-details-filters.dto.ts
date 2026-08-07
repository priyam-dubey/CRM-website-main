import { IsOptional, IsUUID, IsString, IsBooleanString } from "class-validator"
import { PaginationDto } from "../../../common/dto/pagination.dto"

export class RevenueDetailsFiltersDto extends PaginationDto {
  @IsOptional() @IsUUID() agent_id?: string
  @IsOptional() @IsUUID() provider_id?: string
  @IsOptional() @IsString() date_from?: string
  @IsOptional() @IsString() date_to?: string
  @IsOptional() @IsString() range?: string

  // Client's checkbox filters: Refund / Chargeback / "Ticket and MCO Charged" / Pending
  @IsOptional() @IsBooleanString() refund?: string
  @IsOptional() @IsBooleanString() chargeback?: string
  @IsOptional() @IsBooleanString() ticketed_mco?: string
  @IsOptional() @IsBooleanString() pending?: string
}
