import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userService } from "@/services/user.service"
import { userKeys }    from "@/lib/query-keys"
import { toast }       from "sonner"

export function useUsers(params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn:  () => userService.list(params as any),
  })
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn:  () => userService.get(id),
    enabled:  !!id,
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn:  userService.me,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: userService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() })
      toast.success("User created")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to create user"),
  })
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => userService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.detail(id) })
      qc.invalidateQueries({ queryKey: userKeys.all() })
      toast.success("User updated")
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Failed to update user"),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: userService.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userKeys.all() })
      toast.success("User deleted")
    },
    onError: () => toast.error("Failed to delete user"),
  })
}
