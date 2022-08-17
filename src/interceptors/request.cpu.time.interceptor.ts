import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from 'rxjs/operators';
import async_hooks from 'async_hooks';
import { ApiMetricsService } from "src/common/metrics/api.metrics.service";

@Injectable()
export class RequestCpuTimeInterceptor implements NestInterceptor {
  private readonly asyncHookDict: Record<number, { requestId: number, timestamp: number }> = {};
  private readonly requestDict: Record<number, { apiFunction: string, duration: number }> = {};
  private requestIndex = 0;

  private now() {
    const hrTime = process.hrtime();
    return hrTime[0] * 1000 + hrTime[1] / 1000000;
  }

  constructor(
    private readonly apiMetricsService: ApiMetricsService,
  ) {
    async_hooks.createHook({ init: onInit, destroy: onDestroy, before: onBefore, after: onAfter }).enable();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    function onInit(asyncId: number, _: string, triggerAsyncId: number) {
      const previousValue = self.asyncHookDict[triggerAsyncId];
      if (previousValue) {
        self.asyncHookDict[asyncId] = {
          requestId: previousValue.requestId,
          timestamp: 0,
        };
      }
    }

    function onDestroy(asyncId: number) {
      const value = self.asyncHookDict[asyncId];
      if (value) {
        delete self.asyncHookDict[asyncId];
      }

    }

    function onBefore(asyncId: number) {
      const value = self.asyncHookDict[asyncId];
      if (value) {
        value.timestamp = self.now();
      }
    }

    function onAfter(asyncId: number) {
      const asyncHookItem = self.asyncHookDict[asyncId];
      if (asyncHookItem) {
        const requestId = asyncHookItem.requestId;
        const requestItem = self.requestDict[requestId];
        if (requestItem && asyncHookItem.timestamp > 0) {
          self.requestDict[requestId].duration += self.now() - asyncHookItem.timestamp;
        }

        delete self.asyncHookDict[asyncId];
      }
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const apiFunction = context.getClass().name + '.' + context.getHandler().name;
    const request = context.switchToHttp().getRequest();

    const requestId = this.requestIndex++;
    const asyncId = async_hooks.executionAsyncId();

    this.requestDict[requestId] = {
      apiFunction,
      duration: 0,
    };

    this.asyncHookDict[asyncId] = {
      requestId,
      timestamp: 0,
    };

    return next
      .handle()
      .pipe(
        tap(() => {
          const duration = this.requestDict[requestId].duration;
          this.apiMetricsService.setApiCpuTime(apiFunction, duration);

          delete this.requestDict[requestId];

          request.res.set('X-Request-Cpu-Time', duration);
        }),
        catchError(err => {
          const duration = this.requestDict[requestId].duration;
          this.apiMetricsService.setApiCpuTime(apiFunction, duration);

          delete this.requestDict[requestId];

          request.res.set('X-Request-Cpu-Time', duration);

          return throwError(() => err);
        })
      );
  }
}
