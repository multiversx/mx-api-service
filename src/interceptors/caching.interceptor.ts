import { CallHandler, ExecutionContext, HttpException, Injectable, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable, of, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import { MetricsService } from "src/common/metrics/metrics.service";
import { CachingService } from "src/common/caching/caching.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { NoCacheOptions } from "src/decorators/no.cache";
import { DecoratorUtils } from "src/utils/decorator.utils";

@Injectable()
export class CachingInterceptor implements NestInterceptor {
  private pendingRequestsDictionary: { [ key: string]: any; } = {};

  constructor(
    private readonly cachingService: CachingService,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly metricsService: MetricsService,
    private readonly protocolService: ProtocolService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const cachingMetadata = DecoratorUtils.getMethodDecorator(NoCacheOptions, context.getHandler());
    if (cachingMetadata) {
      return next.handle();
    }

    this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

    const cacheKey = this.getCacheKey(context);
    if (cacheKey) {
      const pendingRequest = this.pendingRequestsDictionary[cacheKey];
      if (pendingRequest) {
        const result = await pendingRequest;
        this.metricsService.incrementPendingApiHit(apiFunction);

        if (result instanceof HttpException) {
          return throwError(() => result);
        } else {
          return of(result);
        }
      }

      const cachedValue = await this.cachingService.getCacheLocal(cacheKey);
      if (cachedValue) {
        this.metricsService.incrementCachedApiHit(apiFunction);
        return of(cachedValue);
      }

      let pendingRequestResolver: (value: any) => null;
      this.pendingRequestsDictionary[cacheKey] = new Promise((resolve) => {
        // @ts-ignore
        pendingRequestResolver = resolve;
      });

      return next
        .handle()
        .pipe(
          tap(async (result: any) => {
            delete this.pendingRequestsDictionary[cacheKey ?? ''];
            pendingRequestResolver(result);
            this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);
    
            const ttl = await this.protocolService.getSecondsRemainingUntilNextRound();
    
            await this.cachingService.setCacheLocal(cacheKey ?? '', result, ttl);
          }),
          catchError((err) => {
            delete this.pendingRequestsDictionary[cacheKey ?? ''];
            pendingRequestResolver(err);
            this.metricsService.setPendingRequestsCount(Object.keys(this.pendingRequestsDictionary).length);

            return throwError(() => err);
          })
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