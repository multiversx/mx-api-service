import { PerformanceProfiler } from '@elrondnetwork/erdnest';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiMetricsService } from 'src/common/metrics/api.metrics.service';

@Injectable()
export class GraphQLMetricsInterceptor implements NestInterceptor {
  private readonly apiMetricsService: ApiMetricsService;
  constructor(apiMetricsService: ApiMetricsService) {
    this.apiMetricsService = apiMetricsService;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType<GqlContextType>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();
      const parentType = info.parentType.name;
      const fieldName = info.fieldName;

      const profiler = new PerformanceProfiler();
      return next.handle().pipe(
        tap(() => {
          profiler.stop();
          if (parentType === 'Query') {
            this.apiMetricsService.setGraphqlDuration(
              fieldName,
              profiler.duration,
            );
          }
        }),
      );
    }
    return next.handle();
  }
}
