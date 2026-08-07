export type ActivityAction = 'CREATE'|'UPDATE'|'DELETE'|'VIEW'|'EXPORT'|'LOGIN'|'LOGOUT'|'FAILED_LOGIN'|'PASSWORD_RESET'
export type SecurityEvent = 'LOGIN'|'LOGOUT'|'FAILED_LOGIN'|'IP_BLOCKED'|'SESSION_REVOKED'|'PASSWORD_CHANGED'
export interface ActivityLog {
  id: string; companyId: string; actorId: string|null; actorName: string; action: ActivityAction;
  entityType: string; entityId: string|null; entityLabel: string|null;
  beforeSnapshot: Record<string,unknown>|null; afterSnapshot: Record<string,unknown>|null;
  ipAddress: string|null; userAgent: string|null; createdAt: string
}
export interface SecurityLog {
  id: string; companyId: string; userId: string|null; event: SecurityEvent;
  ipAddress: string; userAgent: string|null; metadata: Record<string,unknown>|null; createdAt: string
}
