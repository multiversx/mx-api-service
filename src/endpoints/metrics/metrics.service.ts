import { Injectable } from "@nestjs/common";
import { register, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { ApiConfigService } from "src/helpers/api.config.service";
import { ShardService } from "../shards/shard.service";

@Injectable()
export class MetricsService {
  private static apiCallsHistogram: Histogram<string>;
  private static currentNonceGauge: Gauge<string>;
  private static lastProcessedNonceGauge: Gauge<string>;
  private static pendingApiHitGauge: Gauge<string>;
  private static cachedApiHitGauge: Gauge<string>;
  private static isDefaultMetricsRegistered: boolean = false;

  constructor(
    private readonly shardService: ShardService,
    private readonly apiConfigService: ApiConfigService
  ) {
    if (!MetricsService.apiCallsHistogram) {
      MetricsService.apiCallsHistogram = new Histogram({
        name: 'api',
        help: 'API Calls',
        labelNames: [ 'endpoint', 'code' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.currentNonceGauge) {
      MetricsService.currentNonceGauge = new Gauge({
        name: 'current_nonce',
        help: 'Current nonce of the given shard',
        labelNames: [ 'shardId' ]
      });
    }

    if (!MetricsService.lastProcessedNonceGauge) {
      MetricsService.lastProcessedNonceGauge = new Gauge({
        name: 'last_processed_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: [ 'shardId' ]
      });
    }

    if (!MetricsService.pendingApiHitGauge) {
      MetricsService.pendingApiHitGauge = new Gauge({
        name: 'pending_api_hits',
        help: 'Number of hits for pending API calls',
        labelNames: [ 'endpoint' ]
      });
    }

    if (!MetricsService.cachedApiHitGauge) {
      MetricsService.cachedApiHitGauge = new Gauge({
        name: 'cached_api_hits',
        help: 'Number of hits for cached API calls',
        labelNames: [ 'endpoint' ]
      });
    }

    if (!MetricsService.isDefaultMetricsRegistered) {
      MetricsService.isDefaultMetricsRegistered = true;
      collectDefaultMetrics();
    }
  }

  setApiCall(endpoint: string, status: number, duration: number) {
    MetricsService.apiCallsHistogram.labels(endpoint, status.toString()).observe(duration);
  }

  setLastProcessedNonce(shardId: number, nonce: number) {
    MetricsService.lastProcessedNonceGauge.set({ shardId }, nonce);
  }

  incrementPendingApiHit(endpoint: string) {
    MetricsService.pendingApiHitGauge.inc({ endpoint });
  }

  incrementCachedApiHit(endpoint: string) {
    MetricsService.cachedApiHitGauge.inc({ endpoint });
  }

  async getMetrics(): Promise<string> {
    if (this.apiConfigService.getIsTransactionProcessorCronActive()) {
      let currentNonces = await this.shardService.getCurrentNonces();
      for (let [index, shardId] of this.shardService.shards.entries()) {
        MetricsService.currentNonceGauge.set({ shardId }, currentNonces[index]);
      }
    }


    return register.metrics();
  }
}