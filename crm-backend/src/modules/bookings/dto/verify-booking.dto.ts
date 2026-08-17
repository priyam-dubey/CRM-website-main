import { IsString, IsBoolean, Equals, MinLength, MaxLength, Matches } from "class-validator"

export class SubmitVerificationDto {
  @IsBoolean()
  @Equals(true, { message: "You must confirm the booking details before signing" })
  confirmed: boolean

  // Signature pad exports a PNG data URL (base64) — bounded length as a
  // sanity check against abuse; a real signature drawing is a few KB.
  // The data:image/ prefix check is defense-in-depth so only image data URLs
  // can ever be stored/rendered here, never data:text/html or similar.
  @IsString()
  @Matches(/^data:image\/(png|jpeg);base64,/, { message: "Signature must be a valid image data URL" })
  @MinLength(100, { message: "A signature is required" })
  @MaxLength(500_000)
  signatureDataUrl: string
}
