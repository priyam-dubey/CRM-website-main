import { IsUUID, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional } from "class-validator"

export class BulkIdsDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100) @IsUUID("4", { each: true })
  ids: string[]
}

export class BulkAssignDto extends BulkIdsDto {
  @IsOptional() @IsUUID()
  assignedToId: string | null
}
