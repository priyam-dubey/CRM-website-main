import { useAuth } from '@/features/auth/hooks/useAuth'
export type Module = 'dashboard'|'bookings'|'users'|'revenue'|'security'|'activity'|'manage'|'settings'
export type Action = 'view'|'create'|'edit'|'delete'|'export'|'manage'
export function usePermission(module: Module, action: Action): boolean {
  const { user } = useAuth()
  if (!user || !user.permissions) return false
  return user.permissions[module]?.[action] ?? false
}
