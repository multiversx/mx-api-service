import { PerformanceProfiler } from '@multiversx/sdk-nestjs';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { LogMetricsEvent } from 'src/common/entities/log.metrics.event';

@Injectable()
export class GraphQLMetricsInterceptor implements NestInterceptor {

  constructor(private readonly eventEmitter: EventEmitter2) { }

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
            const metricsEvent = new LogMetricsEvent();
            metricsEvent.args = [fieldName, profiler.duration];

            this.eventEmitter.emit(
              MetricsEvents.SetGraphqlDuration,
              metricsEvent
            );
          }
        }),
      );
    }
    return next.handle();
  }
}
