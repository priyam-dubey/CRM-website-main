import { Injectable, NestInterceptor, ExecutionContext, CallHandler, GatewayTimeoutException } from "@nestjs/common"
import { Observable, throwError, TimeoutError } from "rxjs"
import { timeout, catchError } from "rxjs/operators"

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(30_000),
      catchError((err) =>
        err instanceof TimeoutError
          ? throwError(() => new GatewayTimeoutException("Request timed out"))
          : throwError(() => err),
      ),
    )
  }
}
