import { IsString, MaxLength, IsUrl } from "class-validator"

export class AttachmentInputDto {
  @IsUrl({ require_tld: false })
  fileUrl: string

  @IsString() @MaxLength(255)
  fileName: string
}
