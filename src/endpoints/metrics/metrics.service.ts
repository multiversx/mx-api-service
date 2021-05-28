import { Injectable } from "@nestjs/common";
import { register, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private static apiCallsHistogram: Histogram<string>;
  private static noncesBehindGauge: Gauge<string>;

  constructor() {
    if (!MetricsService.apiCallsHistogram) {
      MetricsService.apiCallsHistogram = new Histogram({
        name: 'api',
        help: 'API Calls',
        labelNames: [ 'endpoint', 'code' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.noncesBehindGauge) {
      MetricsService.noncesBehindGauge = new Gauge({
        name: 'nonces_behind',
        help: 'Nonces behind for given shard',
        labelNames: [ 'shardId' ]
      });
    }
  }

  setApiCall(endpoint: string, status: number, duration: number) {
    MetricsService.apiCallsHistogram.labels(endpoint, status.toString()).observe(duration);
  }

  setNoncesBehind(shardId: number, nonces: number) {
    MetricsService.noncesBehindGauge.set({ shardId }, nonces);
  }

  getMetrics(): Promise<string> {
    return register.metrics();
  }
}