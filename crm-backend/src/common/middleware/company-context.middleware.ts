import { Injectable, NestMiddleware } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"

@Injectable()
export class CompanyContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const user = (req as any).user
    if (user?.companyId) {
      (req as any).companyId = user.companyId
    }
    next()
  }
}
