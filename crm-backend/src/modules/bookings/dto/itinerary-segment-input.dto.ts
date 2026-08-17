import { IsInt, Min, IsUUID, IsOptional, IsString, MaxLength, IsISO8601, IsIn } from "class-validator"
import { Type } from "class-transformer"
import { ItineraryDirection } from "../../../shared/types/prisma.types"

export class ItinerarySegmentInputDto {
  @IsOptional() @IsIn(Object.values(ItineraryDirection))
  direction?: ItineraryDirection

  @Type(() => Number) @IsInt() @Min(1)
  segmentNumber: number

  @IsUUID()
  airlineId: string

  @IsString() @MaxLength(20)
  flightNumber: string

  // Free text, matching the client's original CRM (e.g. "INDIA" / "USA") —
  // no airport-code lookup is evidenced in the screenshots.
  @IsString() @MaxLength(100)
  fromText: string

  @IsString() @MaxLength(100)
  toText: string

  @IsISO8601()
  departureAt: string

  @IsISO8601()
  arrivalAt: string

  @IsUUID()
  classId: string

  @IsOptional() @IsString() @MaxLength(30)
  pnrConfirmation?: string
}
