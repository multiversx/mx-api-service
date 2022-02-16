import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

const MAX_REQUEST_PAGINATION: number = 10000;
@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.getArgByIndex(0);

    const from: number = parseInt(request.query.from || 0);
    const size: number = parseInt(request.query.size || 0);

    if (from + size > MAX_REQUEST_PAGINATION) {
      throw new HttpException(`Result window is too large, from + size must be less than or equal to: [${MAX_REQUEST_PAGINATION}] but was [${from + size}]`, HttpStatus.BAD_REQUEST);
    }

    return next.handle();
  }
}
