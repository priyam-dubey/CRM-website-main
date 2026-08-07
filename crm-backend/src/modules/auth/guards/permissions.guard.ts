import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { PERMISSION_KEY } from "../../../common/decorators/require-permission.decorator"
import type { Module, Action } from "../../../shared/constants/permissions.constants"

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<{ module: Module; action: Action } | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!required) return true  // no permission required

    const { user } = context.switchToHttp().getRequest()
    const allowed  = user?.permissions?.[required.module]?.[required.action]

    if (!allowed) {
      throw new ForbiddenException(`Permission required: ${required.module}.${required.action}`)
    }
    return true
  }
}
