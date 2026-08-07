import { IsString, IsOptional, MaxLength, MinLength, Matches } from "class-validator"

export class CreateAirlineDto {
  @IsString() @MinLength(2) @MaxLength(200)
  airlineName: string

  @IsString() @MinLength(2) @MaxLength(3)
  @Matches(/^[A-Z0-9]{2,3}$/, { message: "IATA code must be 2-3 uppercase letters/digits" })
  iataCode: string

  @IsOptional() @IsString() @MaxLength(4)
  @Matches(/^[A-Z]{4}$/, { message: "ICAO code must be 4 uppercase letters" })
  icaoCode?: string

  @IsString() @MinLength(2) @MaxLength(100)
  country: string

  @IsOptional() @IsString() @MaxLength(500)
  logoUrl?: string
}
