import { useQuery, useMutation } from "@tanstack/react-query"
import { publicVerificationService } from "@/services/public-verification.service"

export function useResolveVerificationToken(token: string | undefined) {
  return useQuery({
    queryKey: ["public-verification", token],
    queryFn: () => publicVerificationService.resolve(token!),
    enabled: !!token,
    retry: false, // 404/410 mean the token is genuinely invalid/expired — retrying won't help
  })
}

export function useSubmitVerification(token: string | undefined) {
  return useMutation({
    mutationFn: () => publicVerificationService.submit(token!),
  })
}
