import { Netmask } from 'netmask'

export function ipMatchesCidr(ip: string, cidr: string): boolean {
  try {
    const block = new Netmask(cidr)
    return block.contains(ip)
  } catch {
    return false
  }
}

export function extractClientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded
    return first.split(',')[0].trim()
  }
  return req.ip ?? '127.0.0.1'
}
