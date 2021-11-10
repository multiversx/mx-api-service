import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { register, Histogram, Gauge } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";

@Injectable()
export class MetricsService {
  shards?: Promise<number[]>;

  private readonly apiCallsHistogram: Histogram<string> | undefined;
  private readonly pendingRequestsHistogram: Gauge<string> | undefined;
  private readonly externalCallsHistogram: Histogram<string> | undefined;
  private readonly elasticDurationHistogram: Histogram<string> | undefined;
  private readonly elasticTookHistogram: Histogram<string> | undefined;
  private readonly apiResponseSizeHistogram: Histogram<string> | undefined;
  private readonly currentNonceGauge: Gauge<string> | undefined;
  private readonly lastProcessedNonceGauge: Gauge<string> | undefined;
  private readonly pendingApiHitGauge: Gauge<string> | undefined;
  private readonly cachedApiHitGauge: Gauge<string> | undefined;
  private static areMetricsInitialized: boolean = false;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    private readonly protocolService: ProtocolService
  ) {
    if (!MetricsService.areMetricsInitialized) {
      MetricsService.areMetricsInitialized = true;
      this.apiCallsHistogram = new Histogram({
        name: 'api',
        help: 'API Calls',
        labelNames: [ 'endpoint', 'code' ],
        buckets: [ ]
      });
     
      this.pendingRequestsHistogram = new Gauge({
        name: 'pending_requests',
        help: 'Pending requests',
        labelNames: [ 'endpoint' ],
      });
      
      this.externalCallsHistogram = new Histogram({
        name: 'external_apis',
        help: 'External Calls',
        labelNames: [ 'system' ],
        buckets: [ ]
      });
      
      this.elasticDurationHistogram = new Histogram({
        name: 'elastic_duration',
        help: 'Elastic Duration',
        labelNames: [ 'index' ],
        buckets: [ ]
      });
      
      this.elasticTookHistogram = new Histogram({
        name: 'elastic_took',
        help: 'Elastic Took',
        labelNames: [ 'index' ],
        buckets: [ ]
      });
      
      this.apiResponseSizeHistogram = new Histogram({
        name: 'api_response_size',
        help: 'API Response size',
        labelNames: [ 'endpoint' ],
        buckets: [ ]
      });
  
      this.currentNonceGauge = new Gauge({
        name: 'current_nonce',
        help: 'Current nonce of the given shard',
        labelNames: [ 'shardId' ]
      });
    
      this.lastProcessedNonceGauge = new Gauge({
        name: 'last_processed_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: [ 'shardId' ]
      });
    
      this.pendingApiHitGauge = new Gauge({
        name: 'pending_api_hits',
        help: 'Number of hits for pending API calls',
        labelNames: [ 'endpoint' ]
      });
    
      this.cachedApiHitGauge = new Gauge({
        name: 'cached_api_hits',
        help: 'Number of hits for cached API calls',
        labelNames: [ 'endpoint' ]
      });
    }
  }

  setApiCall(endpoint: string, status: number, duration: number, responseSize: number) {
    this.apiCallsHistogram?.labels(endpoint, status.toString()).observe(duration);
    this.apiResponseSizeHistogram?.labels(endpoint).observe(responseSize);
  }

  setPendingRequestsCount(count: number) {
    this.pendingRequestsHistogram?.set(count);
  }

  setExternalCall(system: string, duration: number) {
    this.externalCallsHistogram?.labels(system).observe(duration);
  }

  setElasticDuration(index: string, duration: number) {
    this.elasticDurationHistogram?.labels(index).observe(duration);
  }

  setElasticTook(index: string, took: number) {
    this.elasticTookHistogram?.labels(index).observe(took);
  }

  setLastProcessedNonce(shardId: number, nonce: number) {
    this.lastProcessedNonceGauge?.set({ shardId }, nonce);
  }

  incrementPendingApiHit(endpoint: string) {
    this.pendingApiHitGauge?.inc({ endpoint });
  }

  incrementCachedApiHit(endpoint: string) {
    this.cachedApiHitGauge?.inc({ endpoint });
  }

  async getMetrics(): Promise<string> {
    this.shards = this.protocolService.getNumShards();
    if (this.apiConfigService.getIsTransactionProcessorCronActive()) {
      let currentNonces = await this.getCurrentNonces();
      for (let [index, shardId] of (await this.shards).entries()) {
        this.currentNonceGauge?.set({ shardId }, currentNonces[index]);
      }
    }

    return register.metrics();
  }

  private async getCurrentNonces(): Promise<number[]> {
    this.shards = this.protocolService.getNumShards();

    return await Promise.all(
      (await this.shards).map(shard => this.getCurrentNonce(shard))
    );
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    let shardInfo = await this.gatewayService.get(`network/status/${shardId}`);
    return shardInfo.status.erd_nonce;
  }
}