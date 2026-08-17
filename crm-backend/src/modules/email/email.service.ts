import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import * as nodemailer from "nodemailer"

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

    const tollFree = [p.branding.supportPhoneUsa && `+1 ${p.branding.supportPhoneUsa} (USA)`, p.branding.supportPhoneMexico && `+52 ${p.branding.supportPhoneMexico} (Mexico)`]
      .filter(Boolean).join(" , ")

    return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:0 auto;background:#0F172A;color:#E2E8F0;padding:24px;">
      <div style="text-align:right;font-size:12px;color:#94A3B8;margin-bottom:16px;">
        📞 Toll free : ${escapeHtml(tollFree)}<br/>
        ✉ ${p.branding.supportEmail ? `<a href="mailto:${escapeHtml(p.branding.supportEmail)}" style="color:#60A5FA;">${escapeHtml(p.branding.supportEmail)}</a>` : ""}<br/>
        📍 ${p.branding.address ? escapeHtml(p.branding.address) : ""}
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
        ${escapeHtml(p.branding.brandName)} to charge my debit/credit card for <b>${escapeHtml(p.agreementTotalAmount)}</b>
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
        Thank you for choosing ${escapeHtml(p.branding.brandName)}<br/>
        For support, contact us at Toll free : ${escapeHtml(tollFree)} or Mail at
        ${p.branding.supportEmail ? `<a href="mailto:${escapeHtml(p.branding.supportEmail)}" style="color:#60A5FA;">${escapeHtml(p.branding.supportEmail)}</a>` : ""}
      </div>
    </div>`
  }
}

// Booking data (passenger names, references, etc.) originates from CRM user
// input, so treat it as untrusted when interpolating into email HTML.
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")
}
