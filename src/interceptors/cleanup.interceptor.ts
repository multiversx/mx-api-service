import { ApiUtils } from "@elrondnetwork/nestjs-microservice-common";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';

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
