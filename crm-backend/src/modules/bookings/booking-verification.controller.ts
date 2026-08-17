import { Controller, Get, Post, Param, Req } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import type { Request } from "express"
import { BookingVerificationService } from "./booking-verification.service"
import { Public } from "../../common/decorators/public.decorator"
import { extractClientIp } from "../../shared/utils/cidr.util"

// Mounted outside /bookings deliberately: this is a public, unauthenticated
// surface (the client never logs into the CRM), not a sub-resource of the
// authenticated bookings API. Every route here takes an opaque token, never
// a booking ID — see BookingVerificationService.matchToken.
@Controller("verify")
export class BookingVerificationController {
  constructor(private readonly service: BookingVerificationService) {}

  @Get(":token")
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  resolve(@Param("token") token: string) {
    return this.service.resolveToken(token)
  }

  // No request body: the client's "I Authorize" is a single-click action
  // (see BookingVerificationService.submitVerification for why this is a
  // real POST from a landing page rather than the raw email link itself).
  @Post(":token")
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  submit(@Param("token") token: string, @Req() req: Request) {
    return this.service.submitVerification(token, extractClientIp(req as any))
  }
}
