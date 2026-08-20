import { IsOptional, IsString, IsBoolean } from "class-validator"
import { Transform } from "class-transformer"
import { PaginationDto } from "../../../../common/dto/pagination.dto"

export class AirlineFiltersDto extends PaginationDto {
  @IsOptional() @IsString()
  search?: string

  // Accepts the raw query-string "true"/"false" as well as an
  // already-boolean value — NestJS's global ValidationPipe runs with
  // transformOptions.enableImplicitConversion enabled, and depending on
  // decorator/library ordering this can hand the Transform callback either
  // form. The previous version only matched the exact string "true", so
  // whenever the value arrived pre-coerced to a real boolean, `true ===
  // "true"` was false and isActive silently became `false` — filtering out
  // every real airline, since they're all seeded isActive: true. When the
  // param isn't sent at all we must return undefined (not false), so the
  // repository's `filters.isActive !== undefined` check still skips the
  // filter entirely rather than forcing isActive = false.
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === "true"))
  @IsBoolean()
  isActive?: boolean

  @IsOptional() @IsString()
  country?: string
}
