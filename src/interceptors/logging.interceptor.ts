import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { PerformanceProfiler } from "src/helpers/performance.profiler";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger

  constructor(
    private readonly metricsService: MetricsService,
    private readonly httpAdapterHost: HttpAdapterHost
  ) {
    this.logger = new Logger(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let apiFunction = context.getClass().name + '.' + context.getHandler().name;

    let profiler = new PerformanceProfiler(apiFunction);

    const request = context.getArgByIndex(0);

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    if (httpAdapter.getRequestMethod(request) !== 'GET') {
      this.logger.verbose({
        apiFunction,
        body: request.body,
        userAgent: request.headers['user-agent'],
        clientIp: request.headers['X-Real-Ip']
      });
    }

    return next
      .handle()
      .pipe(
        tap((result) => {
          profiler.stop();

          if (result !== undefined) {
            this.metricsService.setApiCall(apiFunction, 200, profiler.duration, JSON.stringify(result).length);
          } else {
            this.metricsService.setApiCall(apiFunction, 200, profiler.duration, 0);
          }
        }),
      );
  }
}