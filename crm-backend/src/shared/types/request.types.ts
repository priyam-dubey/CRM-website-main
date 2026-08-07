import type { Request } from 'express'
import type { UserRole, PermissionMap } from '../constants/permissions.constants'

export interface JwtPayload {
  sub:         string
  companyId:   string
  role:        UserRole
  permissions: PermissionMap
  iat:         number
  exp:         number
}

export interface AuthenticatedRequest extends Request {
  user:      JwtPayload
  companyId: string
}
