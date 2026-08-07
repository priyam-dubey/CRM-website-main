/**
 * Returns a shallow diff of two objects.
 * Only includes keys that changed.
 */
export function shallowDiff(
  before: Record<string, unknown>,
  after:  Record<string, unknown>,
): { before: Record<string, unknown>; after: Record<string, unknown> } {
  const changedKeys = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  )
  const diffBefore: Record<string, unknown> = {}
  const diffAfter:  Record<string, unknown> = {}
  for (const key of changedKeys) {
    diffBefore[key] = before[key]
    diffAfter[key]  = after[key]
  }
  return { before: diffBefore, after: diffAfter }
}

const SENSITIVE_KEYS = new Set([
  'passwordHash', 'password', 'refreshTokenHash',
  'cardNumber', 'cvv', 'pan', 'token',
])

export function sanitiseSnapshot(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitised: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) continue
    sanitised[key] = value
  }
  // Cap at 60KB to avoid excessive storage
  const json = JSON.stringify(sanitised)
  if (json.length > 60_000) {
    return { truncated: true, originalSize: json.length }
  }
  return sanitised
}
