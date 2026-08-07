import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"
import { safeSerialize } from "../../shared/utils/safe-serialize.util"

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If the service already returned { data, meta } form, pass through
        const wrapped = data && typeof data === "object" && "data" in data ? data : { data }
        // Guaranteed-safe last line of defence: this is the final transform
        // before Nest hands the payload to res.json(). Strip anything that
        // would crash JSON serialization (circular refs, a stray req/res
        // object) instead of letting it reach the socket layer.
        return safeSerialize(wrapped)
      }),
    )
  }
}
