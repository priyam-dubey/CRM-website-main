import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import type { JwtPayload } from "../../shared/types/request.types"

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  },
)
