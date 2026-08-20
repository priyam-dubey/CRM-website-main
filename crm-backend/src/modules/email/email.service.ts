import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"

// Client's actual brand (Aerodeals) — the client's original CRM's booking
// authorization email uses this exact toll-free/support-email/address, and
// the "Demo Company" values seen in local testing come from an unconfigured
// company record, not from a template gap. These act as fallbacks whenever
// a company hasn't set its own branding fields, so the email always renders
// with the client's real identity by default rather than blank/placeholder
// text. If a company later configures its own branding in Settings, those
// values take priority over these defaults (see the `{ ...DEFAULT, ...p.branding }`
// merge below).
const AERODEALS_BRAND_DEFAULTS: CompanyBranding = {
  brandName: "Aerodeals",
  supportPhoneUsa: "888-807-5420",
  supportPhoneMexico: "800-351-0189",
  supportEmail: "customersupport@yourbookingdetail.com",
  address: "9600 Two Notch Rd #5 Columbia, SC 29223, USA",
}

// Inline (base64) logo so the email is self-contained and doesn't depend on
// an externally-hosted image URL that could go missing/be blocked. Sourced
// from the client-provided original logo file, resized for email use only
// (proportions preserved, not distorted).
const AERODEALS_LOGO_DATA_URI = "data:image/png;base64,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"

export interface CompanyBranding {
  brandName: string
  supportPhoneUsa?: string
  supportPhoneMexico?: string
  supportEmail?: string
  address?: string
}

export interface AuthorizationPassenger {
  sNo: number; type: string; name: string; dob: string | null; ticketNumber: string | null
}
export interface AuthorizationFlight {
  airline: string; flight: string; from: string; to: string
  departure: string; arrival: string; class: string; pnrConfirmation: string | null
}
export interface AuthorizationCharge { sNo: number; amount: string; description: string | null }

export interface BookingAuthorizationEmailParams {
  to: string
  branding: CompanyBranding
  bookingId: string          // "BID1873"
  customerEmail: string
  dateOfPurchase: string
  passengers: AuthorizationPassenger[]
  outboundFlights: AuthorizationFlight[]
  returnFlights: AuthorizationFlight[]
  cardHolderName: string
  cardType: string
  cardLast4: string           // masked to **** **** **** {last4} in the template
  billingContactNo: string
  billingAddress: string
  agreementCardHolderName: string
  agreementTotalAmount: string  // e.g. "3000.00 USD"
  charges: AuthorizationCharge[]
  authorizeUrl: string
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly transporter: nodemailer.Transporter | null
  private readonly fromAddress: string

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("email.smtpHost")
    const user = this.config.get<string>("email.smtpUser")
    const pass = this.config.get<string>("email.smtpPass")
    this.fromAddress = this.config.get<string>("email.fromAddress")!

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host, port: this.config.get<number>("email.smtpPort"),
        secure: this.config.get<boolean>("email.smtpSecure"),
        auth: { user, pass },
      })
    } else {
      this.logger.warn("SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — emails will be logged, not sent")
      this.transporter = null
    }
  }

  async sendBookingAuthorizationEmail(params: BookingAuthorizationEmailParams): Promise<void> {
    const subject = `Booking Verification Required — ${params.bookingId}`
    const html = this.renderAuthorizationEmail(params)

    if (!this.transporter) {
      this.logger.log(`[DEV] Would send authorization email to ${params.to}: ${params.authorizeUrl}`)
      return
    }
    // Let this throw — the caller must treat a failed send as a failed
    // request and not leave a misleading PENDING record behind.
    await this.transporter.sendMail({ from: this.fromAddress, to: params.to, subject, html })
  }

  private renderAuthorizationEmail(p: BookingAuthorizationEmailParams): string {
    const passengerRows = p.passengers.map(pax => `
      <tr>
        <td style="padding:8px;border:1px solid #334155;">${pax.sNo}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(pax.type)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(pax.name)}</td>
        <td style="padding:8px;border:1px solid #334155;">${pax.dob ? escapeHtml(pax.dob) : "-"}</td>
        <td style="padding:8px;border:1px solid #334155;">${pax.ticketNumber ? escapeHtml(pax.ticketNumber) : "-"}</td>
      </tr>`).join("")

    const flightRows = (flights: AuthorizationFlight[]) => flights.map(f => `
      <tr>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.airline)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.flight)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.from)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.to)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.departure)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.arrival)}</td>
        <td style="padding:8px;border:1px solid #334155;">${escapeHtml(f.class)}</td>
        <td style="padding:8px;border:1px solid #334155;">${f.pnrConfirmation ? escapeHtml(f.pnrConfirmation) : "-"}</td>
      </tr>`).join("")

    const chargeRows = p.charges.map(c => `
      <tr>
        <td style="padding:8px;border:1px solid #334155;">${c.sNo}</td>
        <td style="padding:8px;border:1px solid #334155;color:#22c55e;">${escapeHtml(c.amount)}</td>
        <td style="padding:8px;border:1px solid #334155;">${c.description ? escapeHtml(c.description) : "-"}</td>
      </tr>`).join("")

    // Fall back per-field to the client's real branding whenever the
    // company record's value is missing/empty — not a blanket object
    // spread, since a spread would still let a populated-but-wrong value
    // (e.g. a placeholder "Demo Company" brand name) win over the default.
    const branding: CompanyBranding = {
      brandName:          p.branding.brandName          || AERODEALS_BRAND_DEFAULTS.brandName,
      supportPhoneUsa:    p.branding.supportPhoneUsa    || AERODEALS_BRAND_DEFAULTS.supportPhoneUsa,
      supportPhoneMexico: p.branding.supportPhoneMexico || AERODEALS_BRAND_DEFAULTS.supportPhoneMexico,
      supportEmail:       p.branding.supportEmail       || AERODEALS_BRAND_DEFAULTS.supportEmail,
      address:            p.branding.address            || AERODEALS_BRAND_DEFAULTS.address,
    }

    const tollFree = [branding.supportPhoneUsa && `+1 ${branding.supportPhoneUsa} (USA)`, branding.supportPhoneMexico && `+52 ${branding.supportPhoneMexico} (Mexico)`]
      .filter(Boolean).join(" , ")

    return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;background:#0F172A;color:#E2E8F0;padding:24px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:16px;">
        <div style="font-size:12px;color:#94A3B8;">
          📞 Toll free : ${escapeHtml(tollFree)}<br/>
          ✉ ${branding.supportEmail ? `<a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:#60A5FA;">${escapeHtml(branding.supportEmail)}</a>` : ""}<br/>
          📍 ${branding.address ? escapeHtml(branding.address) : ""}
        </div>
        <img src="${AERODEALS_LOGO_DATA_URI}" alt="${escapeHtml(branding.brandName)}" style="height:34px;width:auto;flex-shrink:0;" />
      </div>
      <h1 style="text-align:center;font-size:22px;">Itinerary Authorization</h1>

      <h3>Invoice Information</h3>
      <p style="font-style:italic;color:#94A3B8;">Kindly Review Your Information Carefully</p>
      <div style="background:#1E293B;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div>Booking ID: <b>${escapeHtml(p.bookingId)}</b></div>
        <div>Customer Email: <b>${escapeHtml(p.customerEmail)}</b></div>
        <div>Date of Purchase: <b>${escapeHtml(p.dateOfPurchase)}</b></div>
      </div>

      <h3>Passenger Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#2563EB;color:#fff;"><th style="padding:8px;">S NO</th><th style="padding:8px;">TYPE</th><th style="padding:8px;">NAME</th><th style="padding:8px;">DOB</th><th style="padding:8px;">TICKET NUMBER</th></tr></thead>
        <tbody>${passengerRows}</tbody>
      </table>

      <h3>Flight Details:</h3>
      <h4>Outbound Flights:</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px;">
        <thead><tr style="background:#2563EB;color:#fff;"><th style="padding:8px;">AIRLINE</th><th style="padding:8px;">FLIGHT</th><th style="padding:8px;">FROM</th><th style="padding:8px;">TO</th><th style="padding:8px;">DEPARTURE</th><th style="padding:8px;">ARRIVAL</th><th style="padding:8px;">CLASS</th><th style="padding:8px;">PNR/CONFIRMATION</th></tr></thead>
        <tbody>${flightRows(p.outboundFlights)}</tbody>
      </table>
      ${p.returnFlights.length ? `
      <h4>Return Flights:</h4>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#2563EB;color:#fff;"><th style="padding:8px;">AIRLINE</th><th style="padding:8px;">FLIGHT</th><th style="padding:8px;">FROM</th><th style="padding:8px;">TO</th><th style="padding:8px;">DEPARTURE</th><th style="padding:8px;">ARRIVAL</th><th style="padding:8px;">CLASS</th><th style="padding:8px;">PNR/CONFIRMATION</th></tr></thead>
        <tbody>${flightRows(p.returnFlights)}</tbody>
      </table>` : ""}

      <h3>Credit/Debit Card Information</h3>
      <div style="background:#1E293B;border-radius:8px;padding:16px;margin-bottom:20px;">
        <div>Card Holder Name: <b>${escapeHtml(p.cardHolderName)}</b></div>
        <div>Card Type: <b>${escapeHtml(p.cardType)}</b></div>
        <div>Card Number: <b>**** **** **** ${escapeHtml(p.cardLast4)}</b></div>
        <div>CVV Number: <b>...</b></div>
        <div>Expiration Date: <b>...</b></div>
        <div>Contact No: <b>${escapeHtml(p.billingContactNo)}</b></div>
        <div>Address: <b>${escapeHtml(p.billingAddress)}</b></div>
        <div>Date of Purchase: <b>${escapeHtml(p.dateOfPurchase)}</b></div>
      </div>

      <h3>Price Details and Agreement:</h3>
      <p style="font-size:13px;line-height:1.6;">
        As per our telephonic conversation and as agreed, I <b>${escapeHtml(p.agreementCardHolderName)}</b>, authorise
        ${escapeHtml(branding.brandName)} to charge my debit/credit card for <b>${escapeHtml(p.agreementTotalAmount)}</b>
        for airline reservation and ticketing services. I understand that this charge is non-refundable and subject to
        the fare rules and terms and conditions provided at the time of booking. In your next bank statement you will
        see this charge as a split transaction which includes base fare, taxes &amp; fees as described below.
      </p>

      <h3>Charges Description</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
        <thead><tr style="background:#2563EB;color:#fff;"><th style="padding:8px;">S NO</th><th style="padding:8px;">AMOUNT</th><th style="padding:8px;">DESCRIPTION</th></tr></thead>
        <tbody>${chargeRows}</tbody>
      </table>

      <h3>Terms and Conditions</h3>
      <p style="font-size:12px;color:#CBD5E1;line-height:1.6;">
        Tickets are Non-Refundable/Non-Transferable and Passenger name change is not permitted.<br/><br/>
        Date and routing change will be subject to Airline Penalty and Fare Difference (if any).<br/><br/>
        Fares are not guaranteed until ticketed.<br/><br/>
        For modification or changes, please contact us at Toll free : ${escapeHtml(tollFree)}<br/><br/>
        Reservations are non-refundable. Passenger Name changes are not permitted. Date/Route/Time change may incur a penalty and difference in the fare.
      </p>

      <h3>Payment Policy</h3>
      <p style="font-size:12px;color:#CBD5E1;line-height:1.6;">
        We accept all major Debit/Credit Cards.<br/><br/>
        Tickets don't include baggage fees from the airline (if any).<br/><br/>
        Third-party and international Debit/Credit Cards are accepted if authorized by the cardholder.<br/><br/>
        <b>Credit Card Decline:</b> If a Debit/Credit Card is declined while processing the transaction, we will alert
        you via email or call you at your valid phone number immediately or within 24 to 48 hours. In this case,
        neither the transaction will be processed nor the fare and any reservation will be guaranteed.<br/><br/>
        <b>Cancellations and Exchanges:</b> For cancellations and exchanges, you agree to request it at least 24 hours
        prior to scheduled departure(s). All flight tickets bought from us are 100% non-refundable. You, however,
        reserve the right to refund or exchange if it is allowed by the airline according to the fare rules associated
        with the ticket(s).<br/><br/>
        Your ticket(s) may get refunded or exchanged for the original purchase price after the deduction of applicable
        airline penalties, and any fare difference between the original fare paid and the fare associated with the new
        ticket(s).<br/><br/>
        If the passenger is traveling internationally, you may often be offered travel in more than one airline. Each
        airline has formed its own set of fare rules. If more than one set of fare rules are applied to the total
        fare, the most restrictive rules will be applicable to the entire booking.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${p.authorizeUrl}" style="background:#22C55E;color:#fff;padding:12px 32px;border-radius:24px;text-decoration:none;font-weight:600;display:inline-block;">
          I Authorize
        </a>
      </div>

      <div style="background:#1E293B;border-radius:8px;padding:16px;text-align:center;font-size:12px;color:#94A3B8;">
        Thank you for choosing ${escapeHtml(branding.brandName)}<br/>
        For support, contact us at Toll free : ${escapeHtml(tollFree)} or Mail at
        ${branding.supportEmail ? `<a href="mailto:${escapeHtml(branding.supportEmail)}" style="color:#60A5FA;">${escapeHtml(branding.supportEmail)}</a>` : ""}
      </div>
    </div>`
  }
}

// Booking data (passenger names, references, etc.) originates from CRM user
// input, so treat it as untrusted when interpolating into email HTML.
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}
