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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogMetricsEvent } from 'src/common/metrics/events/log-metrics.event';


@Injectable()
export class GraphQLMetricsInterceptor implements NestInterceptor {
  private readonly eventEmitter: EventEmitter2;
  constructor(eventEmitterService: EventEmitter2) {
    this.eventEmitter = eventEmitterService;
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
            const metricsEvent = new LogMetricsEvent();
            metricsEvent.args = [fieldName, profiler.duration];

            this.eventEmitter.emit(
              'setGraphqlDuration',
              metricsEvent
            );
          }
        }),
      );
    }
    return next.handle();
  }
}
