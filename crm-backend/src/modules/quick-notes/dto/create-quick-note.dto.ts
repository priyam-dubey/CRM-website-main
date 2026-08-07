import { IsString, MinLength, MaxLength } from "class-validator"

export class CreateQuickNoteDto {
  @IsString() @MinLength(1, { message: "Note cannot be empty" }) @MaxLength(5000)
  note: string
}
