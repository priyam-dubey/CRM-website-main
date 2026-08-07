import { Injectable, NestMiddleware, Logger } from "@nestjs/common"
import type { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP")

  use(req: Request, res: Response, next: NextFunction) {
    const start     = Date.now()
    const requestId = uuidv4()
    req.headers["x-request-id"] = requestId

    res.on("finish", () => {
      const duration = Date.now() - start
      this.logger.log(
        JSON.stringify({
          requestId,
          method:     req.method,
          path:       req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
          userId:     (req as any).user?.sub,
          companyId:  (req as any).companyId,
          ip:         req.ip,
        }),
      )
    })

    next()
  }
}
