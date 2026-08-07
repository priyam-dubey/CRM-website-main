import { randomBytes } from 'crypto'

export function generateOpaqueToken(byteLength = 48): string {
  return randomBytes(byteLength).toString('hex')
}
