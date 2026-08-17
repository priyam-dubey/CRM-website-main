/** BID1879-style identifier, matching the client's original CRM exactly. */
export function formatBid(bidNumber: number): string {
  return `BID${bidNumber}`
}
