import type { UserRole } from './auth.types'
export interface User {
  id: string; companyId: string; email: string; firstName: string; lastName: string;
  role: UserRole; isActive: boolean; lastLoginAt: string | null; createdAt: string; updatedAt: string
}
