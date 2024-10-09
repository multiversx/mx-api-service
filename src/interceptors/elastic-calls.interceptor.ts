import { ContextTracker, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CallHandler, ExecutionContext, Injectable } from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ApiMetricsService } from "src/common/metrics/api.metrics.service";

@Injectable()
export class ElasticCallsInterceptor {
  private readonly logThreshold: number | undefined;
  private readonly logger = new OriginLogger(ElasticCallsInterceptor.name);

  constructor(
    private readonly apiMetricsService: ApiMetricsService,
    private readonly apiConfigService: ApiConfigService,
  ) {
    this.logThreshold = this.apiConfigService.getElasticCallsTracingLogThreshold();
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const apiFunction = context.getClass().name + '.' + context.getHandler().name;

    const request = context.switchToHttp().getRequest();
    const url = request.url;

    return next
      .handle()
      .pipe(
        tap(() => {
          const contextObj = ContextTracker.get();
          const elasticCalls = contextObj?.elasticCalls;
          if (elasticCalls) {
            this.apiMetricsService.setElasticCalls(apiFunction, elasticCalls.length);

            if (this.logThreshold && elasticCalls.length >= this.logThreshold) {
              this.logger.warn(`Elastic calls threshold exceeded for url '${url}' with ${elasticCalls.length} calls greater than threshold ${this.logThreshold}`);

              if (this.apiConfigService.isElasticCallsTracingVerboseLoggingEnabled()) {
                this.logger.warn(`Elastic call: ${JSON.stringify(elasticCalls)}`);
              }
            }
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }
}
