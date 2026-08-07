import { SetMetadata } from "@nestjs/common"
import type { Module, Action } from "../../shared/constants/permissions.constants"

export const PERMISSION_KEY = "permission"
export const RequirePermission = (module: Module, action: Action) =>
  SetMetadata(PERMISSION_KEY, { module, action })
