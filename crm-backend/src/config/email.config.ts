import { registerAs } from '@nestjs/config'

export default registerAs('email', () => ({
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT ?? '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  // Some providers (e.g. Gmail app passwords, Mailtrap) need explicit TLS off
  // for port 587/2525; default false matches the common STARTTLS-on-587 case.
  smtpSecure: process.env.SMTP_SECURE === 'true',
  fromAddress: process.env.EMAIL_FROM ?? 'BookingCRM <no-reply@bookingcrm.local>',
  // Base URL of the deployed frontend (Vercel in production), used to build
  // the client-facing verification link. No trailing slash.
  frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  // How long a verification link stays valid before it must be re-sent.
  verificationExpiryHours: parseInt(process.env.VERIFICATION_EXPIRY_HOURS ?? '168', 10), // 7 days
}))
