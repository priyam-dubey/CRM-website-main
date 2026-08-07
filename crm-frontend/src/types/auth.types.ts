export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR'
export interface PermissionMap { [module: string]: { [action: string]: boolean } }
export interface AuthUser {
  id: string; companyId: string; email: string; firstName: string;
  lastName: string; role: UserRole; permissions: PermissionMap
}
export interface AuthTokens { accessToken: string }
