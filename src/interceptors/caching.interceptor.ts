import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable, of } from "rxjs";
import { tap } from 'rxjs/operators';
import { CachingService } from "src/helpers/caching.service";

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  constructor(
    private readonly cachingService: CachingService,
    private readonly httpAdapterHost: HttpAdapterHost,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    let cacheKey = this.getCacheKey(context);
    if (cacheKey) {
      let cachedValue = await this.cachingService.getCacheLocal(cacheKey);
      if (cachedValue) {
        return of(cachedValue);
      }

      return next
        .handle()
        .pipe(
          tap(async (result) => {
            let ttl = await this.cachingService.getSecondsRemainingUntilNextRound();

            await this.cachingService.setCacheLocal(cacheKey!!, result, ttl);
          }),
        );
    }

    return next.handle();
  }

  getCacheKey(context: ExecutionContext): string | undefined {
      const httpAdapter = this.httpAdapterHost.httpAdapter;

      const request = context.getArgByIndex(0);
      if (httpAdapter.getRequestMethod(request) !== 'GET') {
          return undefined;
      }

      return httpAdapter.getRequestUrl(request);
  }
}