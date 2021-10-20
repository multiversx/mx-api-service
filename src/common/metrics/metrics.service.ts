import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { register, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "../gateway/gateway.service";

@Injectable()
export class MetricsService {
  shards: number[] = [ 0, 1, 2, 4294967295 ];

  private static apiCallsHistogram: Histogram<string>;
  private static pendingRequestsHistogram: Gauge<string>;
  private static externalCallsHistogram: Histogram<string>;
  private static elasticDurationHistogram: Histogram<string>;
  private static elasticTookHistogram: Histogram<string>;
  private static apiResponseSizeHistogram: Histogram<string>;
  private static currentNonceGauge: Gauge<string>;
  private static lastProcessedNonceGauge: Gauge<string>;
  private static pendingApiHitGauge: Gauge<string>;
  private static cachedApiHitGauge: Gauge<string>;
  private static isDefaultMetricsRegistered: boolean = false;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService
  ) {
    if (!MetricsService.apiCallsHistogram) {
      MetricsService.apiCallsHistogram = new Histogram({
        name: 'api',
        help: 'API Calls',
        labelNames: [ 'endpoint', 'code' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.pendingRequestsHistogram) {
      MetricsService.pendingRequestsHistogram = new Gauge({
        name: 'pending_requests',
        help: 'Pending requests',
        labelNames: [ 'endpoint' ],
      });
    }

    if (!MetricsService.externalCallsHistogram) {
      MetricsService.externalCallsHistogram = new Histogram({
        name: 'external_apis',
        help: 'External Calls',
        labelNames: [ 'system' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.elasticDurationHistogram) {
      MetricsService.elasticDurationHistogram = new Histogram({
        name: 'elastic_duration',
        help: 'Elastic Duration',
        labelNames: [ 'index' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.elasticTookHistogram) {
      MetricsService.elasticTookHistogram = new Histogram({
        name: 'elastic_took',
        help: 'Elastic Took',
        labelNames: [ 'index' ],
        buckets: [ ]
      });
    }

    if (!MetricsService.apiResponseSizeHistogram) {
      MetricsService.apiResponseSizeHistogram = new Histogram({
        name: 'api_response_size',
        help: 'API Response size',
        labelNames: [ 'endpoint' ],
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

  setApiCall(endpoint: string, status: number, duration: number, responseSize: number) {
    MetricsService.apiCallsHistogram.labels(endpoint, status.toString()).observe(duration);
    MetricsService.apiResponseSizeHistogram.labels(endpoint).observe(responseSize);
  }

  setPendingRequestsCount(count: number) {
    MetricsService.pendingRequestsHistogram.set(count);
  }

  setExternalCall(system: string, duration: number) {
    MetricsService.externalCallsHistogram.labels(system).observe(duration);
  }

  setElasticDuration(index: string, duration: number) {
    MetricsService.elasticDurationHistogram.labels(index).observe(duration);
  }

  setElasticTook(index: string, took: number) {
    MetricsService.elasticTookHistogram.labels(index).observe(took);
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
      let currentNonces = await this.getCurrentNonces();
      for (let [index, shardId] of this.shards.entries()) {
        MetricsService.currentNonceGauge.set({ shardId }, currentNonces[index]);
      }
    }


    return register.metrics();
  }

  private async getCurrentNonces(): Promise<number[]> {
    return await Promise.all(
      this.shards.map(shard => this.getCurrentNonce(shard))
    );
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    let shardInfo = await this.gatewayService.get(`network/status/${shardId}`);
    return shardInfo.status.erd_nonce;
  }
}