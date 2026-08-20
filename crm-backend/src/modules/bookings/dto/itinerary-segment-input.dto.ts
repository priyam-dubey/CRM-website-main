import { IsInt, Min, IsUUID, IsOptional, IsString, MaxLength, IsISO8601, IsIn, ValidateIf, IsArray, ArrayMinSize } from "class-validator"
import { Type } from "class-transformer"
import { ItineraryDirection, ItineraryDataType } from "../../../shared/types/prisma.types"

export class ItinerarySegmentInputDto {
  @IsOptional() @IsIn(Object.values(ItineraryDirection))
  direction?: ItineraryDirection

  @Type(() => Number) @IsInt() @Min(1)
  segmentNumber: number

  // Text Data (default, existing behaviour) vs Image Data — client's
  // original CRM "Itinerary Details" mode toggle. In Image Data mode none
  // of the structured flight fields below are collected; imageUrls carries
  // the uploaded itinerary image reference(s) instead.
  @IsOptional() @IsIn(Object.values(ItineraryDataType))
  itineraryType?: ItineraryDataType

  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsUUID()
  airlineId?: string

  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsString() @MaxLength(20)
  flightNumber?: string

  // Free text, matching the client's original CRM (e.g. "INDIA" / "USA") —
  // no airport-code lookup is evidenced in the screenshots.
  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsString() @MaxLength(100)
  fromText?: string

  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsString() @MaxLength(100)
  toText?: string

  // Required for Text Data; optional for Image Data (the client's
  // screenshots show Departure/Arrival without a required-field asterisk
  // when Image Data is selected — only the image itself is marked required).
  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsISO8601()
  departureAt?: string

  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsISO8601()
  arrivalAt?: string

  @ValidateIf(o => o.itineraryType !== ItineraryDataType.IMAGE)
  @IsUUID()
  classId?: string

  @IsOptional() @IsString() @MaxLength(30)
  pnrConfirmation?: string

  // Image Data mode: at least one uploaded itinerary image, matching the
  // screenshot's "Itinerary Images * (Required - Please upload at least one
  // image)" validation.
  @ValidateIf(o => o.itineraryType === ItineraryDataType.IMAGE)
  @IsArray() @ArrayMinSize(1) @IsString({ each: true }) @MaxLength(500, { each: true })
  imageUrls?: string[]
}
