import { IsString, MinLength, MaxLength, IsUUID, Matches, IsInt, Min, Max, IsEmail, IsOptional, IsISO8601 } from "class-validator"
import { Type } from "class-transformer"

const CURRENT_YEAR = new Date().getFullYear()

// Deliberately no `cardNumber` and no `cvv` fields on this DTO. The client's
// original CRM UI collects both (the form is unchanged — see the frontend
// billing step), but:
//  - CVV must never reach or be stored by the backend at all (PCI-DSS
//    Requirement 3.2 — storing CVV post-authorization is a compliance
//    violation), and the client's own "Itinerary Authorization" email never
//    shows a real CVV either (shown as "..."), so this isn't a functionality
//    gap relative to their original system.
//  - The full card number is truncated to `cardLast4` in the browser before
//    the request is ever sent — matching what their own email shows
//    downstream ("**** **** **** 9850").
// GlobalValidationPipe's forbidNonWhitelisted:true means if a future frontend
// change ever accidentally includes `cardNumber`/`cvv` in the payload, the
// request is hard-rejected (400) rather than silently accepted — this DTO's
// shape is itself the enforcement, not just documentation.
export class BillingInputDto {
  @IsString() @MinLength(2) @MaxLength(200)
  cardHolderName: string

  @IsUUID()
  cardProcessorId: string

  @Matches(/^\d{4}$/, { message: "cardLast4 must be exactly 4 digits" })
  cardLast4: string

  @Type(() => Number) @IsInt() @Min(1) @Max(12)
  expiryMonth: number

  @Type(() => Number) @IsInt() @Min(CURRENT_YEAR) @Max(CURRENT_YEAR + 20)
  expiryYear: number

  @IsEmail() @MaxLength(320)
  billingEmail: string

  @IsString() @MinLength(5) @MaxLength(30)
  billingContactNo: string

  @IsOptional() @IsString() @MaxLength(300)
  billingStreet?: string

  @IsOptional() @IsString() @MaxLength(100)
  billingCity?: string

  @IsOptional() @IsString() @MaxLength(100)
  billingState?: string

  @IsOptional() @IsString() @MaxLength(20)
  billingZip?: string

  @IsOptional() @IsString() @MaxLength(100)
  billingCountry?: string

  @IsOptional() @IsISO8601()
  purchaseDate?: string
}
