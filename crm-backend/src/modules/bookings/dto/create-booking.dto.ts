import { IsString, IsUUID, IsOptional, MaxLength, IsIn, IsBoolean, IsEmail, ValidateNested, ArrayMinSize, IsObject } from "class-validator"
import { Type } from "class-transformer"
import { BookingStatus, TransactionType } from "../../../shared/types/prisma.types"
import { ChargeInputDto } from "./charge-input.dto"
import { ItinerarySegmentInputDto } from "./itinerary-segment-input.dto"
import { PassengerInputDto } from "./passenger-input.dto"
import { BillingInputDto } from "./billing-input.dto"
import { AttachmentInputDto } from "./attachment-input.dto"

export class CreateBookingDto {
  @IsUUID()
  providerId: string

  @IsOptional() @IsUUID()
  callQueueId?: string

  // Entered in the "Create New Transaction" pre-wizard step; the
  // authorization email is sent here.
  @IsEmail() @MaxLength(320)
  customerEmail: string

  // Master reservation/confirmation number ("Basic Details" step). Optional —
  // the client's screenshots show it generated/entered per-transaction-type;
  // not every transaction type necessarily has one at creation time.
  @IsOptional() @IsString() @MaxLength(20)
  pnr?: string

  @IsOptional() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsOptional() @IsUUID()
  assignedToId?: string

  @IsOptional() @IsBoolean()
  isUrgent?: boolean

  // Selected in "Create New Transaction" (Select Transaction Type). Defaults
  // to NEW_BOOKING in the service when omitted, same as before.
  @IsOptional() @IsIn(Object.values(TransactionType))
  transactionType?: TransactionType

  @ValidateNested({ each: true }) @Type(() => ChargeInputDto) @ArrayMinSize(1)
  charges: ChargeInputDto[]

  @ValidateNested({ each: true }) @Type(() => ItinerarySegmentInputDto) @ArrayMinSize(1)
  segments: ItinerarySegmentInputDto[]

  @ValidateNested({ each: true }) @Type(() => PassengerInputDto) @ArrayMinSize(1)
  passengers: PassengerInputDto[]

  @ValidateNested() @Type(() => BillingInputDto)
  billing: BillingInputDto

  @IsOptional() @ValidateNested({ each: true }) @Type(() => AttachmentInputDto)
  attachments?: AttachmentInputDto[]

  // "Special Details" step — stored on the Transaction record's existing
  // `metadata` field (see schema.prisma). The client's screenshots show this
  // empty for NEW_BOOKING ("No special fields required for this transaction
  // type"); left as a free-form passthrough rather than inventing fields for
  // transaction types with no screenshot evidence.
  @IsOptional() @IsObject()
  specialDetails?: Record<string, unknown>
}
