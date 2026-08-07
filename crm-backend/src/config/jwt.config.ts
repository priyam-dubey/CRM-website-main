import { registerAs } from '@nestjs/config'

const isProd = process.env.NODE_ENV === 'production'

function requireInProd(value: string | undefined, name: string, devFallback: string): string {
  if (value) return value
  if (isProd) {
    throw new Error(`${name} must be set in production (no insecure fallback is allowed).`)
  }
  return devFallback
}

export default registerAs('jwt', () => ({
  accessTokenSecret:  requireInProd(process.env.ACCESS_TOKEN_SECRET,  'ACCESS_TOKEN_SECRET',  'dev-access-secret'),
  refreshTokenSecret: requireInProd(process.env.REFRESH_TOKEN_SECRET, 'REFRESH_TOKEN_SECRET', 'dev-refresh-secret'),
  accessTokenExpiry:  process.env.ACCESS_TOKEN_EXPIRY  ?? '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? '7d',
}))
