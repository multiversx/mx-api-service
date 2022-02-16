import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { ApiUtils } from "src/utils/api.utils";

@Injectable()
export class CleanupInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle()
      .pipe(
        tap(result => ApiUtils.cleanupApiValueRecursively(result))
      );
  }
}
