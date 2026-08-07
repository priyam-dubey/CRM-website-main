import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common"
import type { Request, Response } from "express"

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx      = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request  = ctx.getRequest<Request>()

    // Guard against the filter being invoked a second time for a response that
    // has already been sent (e.g. an error thrown while Nest was serializing a
    // successful reply). Without this check, a second write attempt throws
    // ERR_HTTP_HEADERS_SENT and crashes the process instead of degrading gracefully.
    if (response.headersSent) {
      this.logger.error(
        "GlobalExceptionFilter invoked after headers were already sent — dropping duplicate response",
        exception instanceof Error ? exception.stack : undefined,
      )
      return
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR
    let message    = "Internal server error"
    let error      = "Internal Server Error"
    let code       = "INTERNAL_ERROR"
    let fieldErrors: { field: string; message: string }[] | undefined

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const body = exception.getResponse() as any
      message    = body.message ?? exception.message
      error      = body.error   ?? "Error"
      code       = body.code    ?? "HTTP_ERROR"

      // Handle class-validator field errors
      if (Array.isArray(body.message)) {
        fieldErrors = body.message.map((m: string) => {
          const parts = m.split(" ")
          return { field: parts[0], message: m }
        })
        message = "Validation failed"
        code    = "VALIDATION_ERROR"
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack)
    }

    const payload = {
      statusCode,
      error,
      message,
      code,
      ...(fieldErrors ? { fieldErrors } : {}),
      timestamp: new Date().toISOString(),
      path:      request.url,
    }

    // Last-resort safety net: the payload above is always built from plain
    // strings/primitives, so it should never fail to serialize. But if a
    // future exception body ever carries something non-serializable (e.g. a
    // raw error object, a class instance with a circular reference), fall
    // back to a minimal, guaranteed-safe response instead of letting
    // response.json() throw and take the process down.
    try {
      response.status(statusCode).json(payload)
    } catch (serializationError) {
      this.logger.error(
        "Failed to serialize error response — falling back to minimal payload",
        serializationError instanceof Error ? serializationError.stack : undefined,
      )
      if (!response.headersSent) {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).setHeader("Content-Type", "application/json")
        response.end(JSON.stringify({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error:      "Internal Server Error",
          message:    "Internal server error",
          code:       "SERIALIZATION_ERROR",
          timestamp:  new Date().toISOString(),
          path:       request.url,
        }))
      }
    }
  }
}
