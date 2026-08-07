export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR'
export type Module   = 'dashboard'|'bookings'|'users'|'revenue'|'security'|'activity'|'manage'|'settings'
export type Action   = 'view'|'create'|'edit'|'delete'|'export'|'manage'

export type PermissionMap = Partial<Record<Module, Partial<Record<Action, boolean>>>>

export const ROLE_PERMISSIONS: Record<UserRole, PermissionMap> = {
  ADMIN: {
    dashboard: { view: true, export: true },
    bookings:  { view: true, create: true, edit: true, delete: true, export: true },
    users:     { view: true, create: true, edit: true, delete: true, manage: true },
    revenue:   { view: true, create: true, edit: true, delete: true, export: true, manage: true },
    security:  { view: true, manage: true },
    activity:  { view: true, export: true },
    manage:    { view: true, create: true, edit: true, delete: true },
    settings:  { view: true, manage: true },
  },
  MANAGER: {
    dashboard: { view: true, export: true },
    bookings:  { view: true, create: true, edit: true, export: true },
    users:     { view: true },
    revenue:   { view: true, create: true, edit: true, export: true, manage: true },
    security:  { view: true },
    activity:  { view: true },
    manage:    { view: true, create: true, edit: true },
    settings:  { view: true },
  },
  OPERATOR: {
    dashboard: { view: true },
    bookings:  { view: true, create: true, edit: true },
    manage:    { view: true },
    settings:  { view: true },
  },
}
