import { IsString, IsUUID, IsInt, IsOptional, MaxLength, Min, IsEmail, IsIn, IsBoolean, Matches } from "class-validator"
import { Type } from "class-transformer"
import { BookingStatus } from "../../../shared/types/prisma.types"
import { UUID_SHAPE_REGEX } from "../../../shared/validators/uuid-shape"

// Scoped to top-level Booking fields only. Charges/segments/passengers/
// billing are set at creation; modifying them is the "Create Revision"
// action (appends a new BookingTransaction) shown in the client's
// screenshots, not an in-place PATCH — matching the existing
// BookingTransaction architecture rather than inventing nested-PATCH
// semantics with no screenshot evidence.
export class UpdateBookingDto {
  @IsOptional() @IsEmail() @MaxLength(320)
  customerEmail?: string

  @IsOptional() @IsString() @MaxLength(20)
  pnr?: string

  @IsOptional() @IsIn(Object.values(BookingStatus))
  status?: BookingStatus

  @IsOptional() @IsUUID() providerId?: string
  // Permissive UUID-shape check — see shared/validators/uuid-shape.ts
  // (the seeded "General Enquiries" call queue's id isn't a strict RFC4122 UUID).
  @IsOptional() @Matches(UUID_SHAPE_REGEX, { message: "callQueueId must be a UUID" }) callQueueId?: string
  @IsOptional() @IsUUID() assignedToId?: string

  @IsOptional() @IsBoolean()
  isUrgent?: boolean

  // Optimistic locking
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  version?: number
}
