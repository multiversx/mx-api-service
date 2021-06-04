import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { PerformanceProfiler } from "src/helpers/performance.profiler";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger

  constructor(
    private readonly metricsService: MetricsService
  ) {
    this.logger = new Logger(LoggingInterceptor.name);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let apiFunction = context.getClass().name + '.' + context.getHandler().name;

    let profiler = new PerformanceProfiler(apiFunction);

    const req = context.getArgByIndex(0);

    this.logger.verbose({
      userAgent: req.headers['user-agent'],
      clientIp: req.headers['X-Real-Ip']
    });

    return next
      .handle()
      .pipe(
        tap((result) => {
          profiler.stop();

          this.metricsService.setApiCall(apiFunction, 200, profiler.duration, JSON.stringify(result).length);
        }),
      );
  }
}