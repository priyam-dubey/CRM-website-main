import { Injectable, NotFoundException, BadRequestException, ConflictException, GoneException, InternalServerErrorException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { BookingVerificationRepository } from "./booking-verification.repository"
import { BookingsRepository } from "./bookings.repository"
import { PrismaService } from "../../database/prisma.service"
import { EmailService, type CompanyBranding } from "../email/email.service"
import { ActivityService } from "../activity/activity.service"
import { generateOpaqueToken } from "../../shared/utils/token.util"
import { hashToken, compareToken } from "../../shared/utils/hash.util"
import type { JwtPayload } from "../../shared/types/request.types"

const DATE_FMT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
const DATETIME_FMT: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }

// Company branding for the authorization email header/footer — read from
// Company.metadata (already a flexible Json field on that model) rather than
// adding dedicated columns for what is, for now, a handful of optional
// display strings. Falls back to generic values if a company hasn't
// configured any of this.
function readBranding(company: any): CompanyBranding {
  const meta = (company?.metadata ?? {}) as Record<string, unknown>
  return {
    brandName:          (meta.brandName as string) ?? company?.name ?? "BookingCRM",
    supportPhoneUsa:    meta.supportPhoneUsa as string | undefined,
    supportPhoneMexico: meta.supportPhoneMexico as string | undefined,
    supportEmail:       meta.supportEmail as string | undefined,
    address:            meta.address as string | undefined,
  }
}

// Reviewable summary shown on the public landing page after the client
// clicks through from the email — deliberately minimal (the full
// passenger/flight/card/charges breakdown already lives in the email itself,
// per the client's screenshots; this page's only job is the one-click
// "I Authorize" action, not re-displaying everything).
function buildSnapshot(booking: any) {
  const primaryPassenger = booking.passengers?.[0]
  return {
    reference: booking.reference,
    customerEmail: booking.customerEmail,
    passengerName: primaryPassenger ? `${primaryPassenger.firstName} ${primaryPassenger.lastName}` : null,
  }
}

@Injectable()
export class BookingVerificationService {
  constructor(
    private readonly repo:         BookingVerificationRepository,
    private readonly bookingsRepo: BookingsRepository,
    private readonly prisma:       PrismaService,
    private readonly email:        EmailService,
    private readonly activity:     ActivityService,
    private readonly config:       ConfigService,
  ) {}

  async sendVerification(bookingId: string, companyId: string, actor: JwtPayload) {
    const booking = await this.bookingsRepo.findById(bookingId, companyId)
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`)
    if (!booking.customerEmail) {
      throw new BadRequestException("This booking has no customer email on file — add one before sending for verification")
    }
    if (!(booking as any).billing) {
      throw new BadRequestException("This booking has no billing details on file — add them before sending for verification")
    }

    const latest = await this.repo.findLatestForBooking(bookingId)
    if (latest?.status === "VERIFIED") {
      throw new ConflictException("This booking is already verified")
    }

    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    const branding = readBranding(company)

    const rawToken = generateOpaqueToken()
    const tokenHash = await hashToken(rawToken)
    const expiryHours = this.config.get<number>("email.verificationExpiryHours")!
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

    const verification = await this.repo.create({
      bookingId, companyId, requestedById: actor.sub, tokenHash,
      clientEmail: booking.customerEmail,
      bookingSnapshot: buildSnapshot(booking),
      expiresAt,
    })

    const frontendUrl = this.config.get<string>("email.frontendUrl")!
    const authorizeUrl = `${frontendUrl}/verify/${rawToken}`

    const b: any = booking
    const totalMinor = (b.charges ?? []).reduce((s: number, c: any) => s + c.amount, 0)
    const currency = b.charges?.[0]?.currency
    const totalDisplay = currency ? `${(totalMinor / 100).toFixed(2)} ${currency.code}` : (totalMinor / 100).toFixed(2)
    const billingAddress = [b.billing.billingStreet, b.billing.billingCity, b.billing.billingState, b.billing.billingZip, b.billing.billingCountry].filter(Boolean).join(", ")

    try {
      await this.email.sendBookingAuthorizationEmail({
        to: booking.customerEmail,
        branding,
        bookingId: booking.reference,
        customerEmail: booking.customerEmail,
        dateOfPurchase: new Date(b.billing.purchaseDate).toLocaleDateString("en-US", DATE_FMT),
        passengers: (b.passengers ?? []).map((p: any, i: number) => ({
          sNo: i + 1, type: capitalize(p.type), name: [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" "),
          dob: p.dob ? new Date(p.dob).toLocaleDateString("en-US", DATE_FMT) : null, ticketNumber: p.ticketNumber ?? null,
        })),
        outboundFlights: (b.segments ?? []).filter((s: any) => s.direction === "OUTBOUND").map((s: any) => segmentToFlight(s)),
        returnFlights:   (b.segments ?? []).filter((s: any) => s.direction === "RETURN").map((s: any) => segmentToFlight(s)),
        cardHolderName: b.billing.cardHolderName,
        cardType: b.billing.cardProcessor?.name ?? "Card",
        cardLast4: b.billing.cardLast4,
        billingContactNo: b.billing.billingContactNo,
        billingAddress,
        agreementCardHolderName: b.billing.cardHolderName,
        agreementTotalAmount: totalDisplay,
        charges: (b.charges ?? []).map((c: any, i: number) => ({
          sNo: i + 1, amount: currency ? `${(c.amount / 100).toFixed(0)} ${currency.code}` : String(c.amount / 100), description: c.description ?? null,
        })),
        authorizeUrl,
      })
    } catch (err) {
      // Don't leave a PENDING record the client will never receive a link
      // for — roll it back and surface a clear failure to the CRM user.
      await this.repo.deleteById(verification.id)
      throw new InternalServerErrorException("Failed to send the authorization email — please try again")
    }

    this.activity.write({
      companyId, actorId: actor.sub, actorName: actor.sub, action: "CREATE",
      entityType: "BookingVerification", entityId: verification.id, entityLabel: booking.reference,
      afterSnapshot: { clientEmail: booking.customerEmail, expiresAt },
    })

    return { id: verification.id, status: verification.status, clientEmail: verification.clientEmail, createdAt: verification.createdAt }
  }

  /** Public: resolves a raw token from the email link. Never trusts a bookingId from the URL. */
  async resolveToken(rawToken: string) {
    const { verification } = await this.matchToken(rawToken)

    if (verification.status === "VERIFIED") {
      return { status: "VERIFIED" as const, verifiedAt: verification.verifiedAt, snapshot: verification.bookingSnapshot }
    }

    if (verification.expiresAt < new Date()) {
      await this.repo.markExpired(verification.id)
      throw new GoneException("This authorization link has expired. Please ask the CRM team to resend it.")
    }

    // Booking may have been edited after this link was sent — force a fresh
    // request rather than let the client authorize stale data (see
    // schema.prisma comment on BookingVerification for the reasoning).
    const booking = await this.bookingsRepo.findById(verification.bookingId, verification.companyId)
    if (!booking || new Date(booking.updatedAt) > verification.createdAt) {
      await this.repo.markExpired(verification.id)
      throw new GoneException("This booking has changed since this link was sent. Please ask the CRM team to resend the authorization email.")
    }

    return { status: "PENDING" as const, snapshot: verification.bookingSnapshot }
  }

  /**
   * Public: the client clicks "I Authorize" on the landing page (a real
   * user-initiated POST, not the raw email link itself — see
   * BookingVerificationController for why: email security scanners routinely
   * pre-fetch links, which would otherwise auto-authorize bookings before a
   * human ever saw the email). No signature/confirmation body is required —
   * matching the client's actual screenshot, which shows a single-click
   * action with the full review already inline in the email.
   */
  async submitVerification(rawToken: string, ip: string) {
    const { verification } = await this.matchToken(rawToken)

    if (verification.status === "VERIFIED") {
      // Duplicate submit (double click, retried request) — idempotent, not an error.
      return { status: "VERIFIED" as const, verifiedAt: verification.verifiedAt }
    }

    if (verification.expiresAt < new Date()) {
      await this.repo.markExpired(verification.id)
      throw new GoneException("This authorization link has expired.")
    }

    const booking = await this.bookingsRepo.findById(verification.bookingId, verification.companyId)
    if (!booking || new Date(booking.updatedAt) > verification.createdAt) {
      await this.repo.markExpired(verification.id)
      throw new GoneException("This booking has changed since this link was sent. Please ask the CRM team to resend the authorization email.")
    }

    // Optimistic guard: only one concurrent request can win this update.
    const won = await this.repo.markVerified(verification.id, ip)
    if (!won) {
      return { status: "VERIFIED" as const, verifiedAt: new Date() }
    }

    this.activity.write({
      companyId: verification.companyId, action: "UPDATE", actorName: verification.clientEmail,
      entityType: "BookingVerification", entityId: verification.id,
      afterSnapshot: { status: "VERIFIED", verifiedIp: ip },
    })

    return { status: "VERIFIED" as const, verifiedAt: new Date() }
  }

  private async matchToken(rawToken: string) {
    const candidates = await this.repo.findTokenLookupCandidates()
    for (const candidate of candidates) {
      if (await compareToken(rawToken, candidate.tokenHash)) {
        return { verification: candidate }
      }
    }
    throw new NotFoundException("Invalid authorization link")
  }
}

function segmentToFlight(s: any) {
  return {
    airline: s.airline?.airlineName ?? "-", flight: s.flightNumber, from: s.fromText, to: s.toText,
    departure: new Date(s.departureAt).toLocaleDateString("en-US", DATETIME_FMT),
    arrival: new Date(s.arrivalAt).toLocaleDateString("en-US", DATETIME_FMT),
    class: s.class?.name ?? "-", pnrConfirmation: s.pnrConfirmation ?? null,
  }
}
function capitalize(s: string) {
  return s.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")
}
