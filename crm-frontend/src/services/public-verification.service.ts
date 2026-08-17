import { apiClient } from "@/lib/api-client"

export interface ResolveTokenResult {
  status: "PENDING" | "VERIFIED"
  snapshot: { reference: string; customerEmail: string; passengerName: string | null }
  verifiedAt?: string | null
}

export const publicVerificationService = {
  // Every backend response — including @Public() routes — is wrapped in
  // { data: ... } by the global ResponseInterceptor, same as every other
  // endpoint in this app; unwrap it the same way booking.service.ts does.
  resolve: (token: string) =>
    apiClient.get<{ data: ResolveTokenResult }>(`/verify/${token}`).then(r => r.data.data),

  // "I Authorize" is a single-click action — no signature, no confirmation
  // body — matching the client's original CRM screenshots exactly.
  submit: (token: string) =>
    apiClient
      .post<{ data: { status: "VERIFIED"; verifiedAt: string } }>(`/verify/${token}`)
      .then(r => r.data.data),
}
