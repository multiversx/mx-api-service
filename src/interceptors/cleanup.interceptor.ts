import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { cleanupApiValueRecursively } from "src/helpers/helpers";

@Injectable()
export class CleanupInterceptor implements NestInterceptor {
  async intercept(_: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    return next
      .handle()
      .pipe(
        tap(result => cleanupApiValueRecursively(result))
      );
  }
}