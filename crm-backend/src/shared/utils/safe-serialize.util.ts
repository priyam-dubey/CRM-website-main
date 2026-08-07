/**
 * Recursively strips values that cannot be safely sent to `res.json()`:
 *  - circular references (an object that is its own ancestor in the graph)
 *  - raw Node.js request/response/socket/stream objects, which should never
 *    legitimately end up in a response body but are the classic source of
 *    "Converting circular structure to JSON" crashes if they ever leak in
 *    by accident (e.g. a handler returning `req` or `res` by mistake).
 *
 * Everything else (Dates, plain objects, arrays, class instances with
 * toJSON(), primitives) passes through untouched — this only intervenes
 * on the specific shapes that would otherwise crash serialization.
 */

const UNSAFE_CONSTRUCTOR_NAMES = new Set([
  "Socket",
  "TLSSocket",
  "IncomingMessage",
  "ServerResponse",
  "ClientRequest",
  "HTTPParser",
  "Agent",
])

function isUnsafeNodeObject(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false
  const ctorName = (value as { constructor?: { name?: string } }).constructor?.name
  return !!ctorName && UNSAFE_CONSTRUCTOR_NAMES.has(ctorName)
}

export function safeSerialize<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
  if (value === null || typeof value !== "object") return value

  if (isUnsafeNodeObject(value)) {
    return "[Unserializable]" as unknown as T
  }

  if (value instanceof Date || (typeof (value as any).toJSON === "function")) {
    return value
  }

  if (seen.has(value as object)) {
    return "[Circular]" as unknown as T
  }
  seen.add(value as object)

  if (Array.isArray(value)) {
    return value.map((item) => safeSerialize(item, seen)) as unknown as T
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    result[key] = safeSerialize(val, seen)
  }
  return result as T
}
