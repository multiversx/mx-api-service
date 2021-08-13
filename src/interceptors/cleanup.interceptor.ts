import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { ApiUtils } from "src/utils/api.utils";

@Injectable()
export class CleanupInterceptor implements NestInterceptor {
  async intercept(_: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return next
      .handle()
      .pipe(
        tap(result => ApiUtils.cleanupApiValueRecursively(result))
      );
  }
}