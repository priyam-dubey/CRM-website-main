import { IsOptional, IsInt, Min, Max, IsString, IsIn } from "class-validator"
import { Type } from "class-transformer"

export class PaginationDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  per_page: number = 25

  @IsOptional() @IsString()
  sort_by?: string

  @IsOptional() @IsString() @IsIn(["asc","desc"])
  sort_dir?: "asc" | "desc" = "desc"
}

export class CursorPaginationDto {
  @IsOptional() @IsString()
  cursor?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit: number = 25
}
