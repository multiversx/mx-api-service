import { Injectable } from "@nestjs/common";
import { register, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private static histogram: Histogram<string>;

  constructor() {
    if (!MetricsService.histogram) {
      MetricsService.histogram = new Histogram({
        name: 'api',
        help: 'API Calls',
        labelNames: [ 'endpoint', 'code' ],
        buckets: [ 1, 10, 100, 500, 1000, 10000 ]
      });
    }
  }

  setApiCall(endpoint: string, status: number, duration: number) {
    MetricsService.histogram.labels(endpoint, status.toString()).observe(duration);
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}