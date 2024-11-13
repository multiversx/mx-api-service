import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService, PerformanceProfiler } from '@multiversx/sdk-nestjs-monitoring';

@Injectable()
export class ResponseTimeCpuInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const profiler = new PerformanceProfiler();
    const startCpuUsage = process.cpuUsage();

    return next.handle().pipe(
      tap(() => {
        const duration = profiler.stop();
        const endCpuUsage = process.cpuUsage(startCpuUsage);
        const cpuUsage = (endCpuUsage.user + endCpuUsage.system) / 1000;

        const request = context.switchToHttp().getRequest();
        const endpoint = request.url;

        this.metricsService.setExternalCall('response_time', duration);
        this.metricsService.setExternalCall('cpu_usage', cpuUsage);

        if (duration > 1000) {
          console.warn(`Warning: Response time for ${endpoint} is ${duration}ms`);
        }

        if (cpuUsage > 500) {
          console.warn(`Warning: CPU usage for ${endpoint} is ${cpuUsage}ms`);
        }
      }),
    );
  }
}
