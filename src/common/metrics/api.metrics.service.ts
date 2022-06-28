import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { register, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";
import { ElasticMetricType } from "./entities/elastic.metric.type";

@Injectable()
export class ApiMetricsService {
  private static vmQueriesHistogram: Histogram<string>;
  private static pendingRequestsHistogram: Gauge<string>;
  private static externalCallsHistogram: Histogram<string>;
  private static elasticDurationHistogram: Histogram<string>;
  private static gatewayDurationHistogram: Histogram<string>;
  private static elasticTookHistogram: Histogram<string>;
  private static redisDurationHistogram: Histogram<string>;
  private static persistenceDurationHistogram: Histogram<string>;
  private static jobsHistogram: Histogram<string>;
  private static currentNonceGauge: Gauge<string>;
  private static lastProcessedNonceGauge: Gauge<string>;
  private static pendingApiHitGauge: Gauge<string>;
  private static cachedApiHitGauge: Gauge<string>;
  private static isDefaultMetricsRegistered: boolean = false;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => ProtocolService))
    private readonly protocolService: ProtocolService,
  ) {
    if (!ApiMetricsService.vmQueriesHistogram) {
      ApiMetricsService.vmQueriesHistogram = new Histogram({
        name: 'vm_query',
        help: 'VM Queries',
        labelNames: ['address', 'function'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.pendingRequestsHistogram) {
      ApiMetricsService.pendingRequestsHistogram = new Gauge({
        name: 'pending_requests',
        help: 'Pending requests',
        labelNames: ['endpoint'],
      });
    }

    if (!ApiMetricsService.externalCallsHistogram) {
      ApiMetricsService.externalCallsHistogram = new Histogram({
        name: 'external_apis',
        help: 'External Calls',
        labelNames: ['system'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.elasticDurationHistogram) {
      ApiMetricsService.elasticDurationHistogram = new Histogram({
        name: 'elastic_duration',
        help: 'Elastic Duration',
        labelNames: ['type', 'index'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.gatewayDurationHistogram) {
      ApiMetricsService.gatewayDurationHistogram = new Histogram({
        name: 'gateway_duration',
        help: 'Gateway Duration',
        labelNames: ['endpoint'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.elasticTookHistogram) {
      ApiMetricsService.elasticTookHistogram = new Histogram({
        name: 'elastic_took',
        help: 'Elastic Took',
        labelNames: ['index'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.redisDurationHistogram) {
      ApiMetricsService.redisDurationHistogram = new Histogram({
        name: 'redis_duration',
        help: 'Redis Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.persistenceDurationHistogram) {
      ApiMetricsService.persistenceDurationHistogram = new Histogram({
        name: 'persistence_duration',
        help: 'Persistence Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.jobsHistogram) {
      ApiMetricsService.jobsHistogram = new Histogram({
        name: 'jobs',
        help: 'Jobs',
        labelNames: ['job_identifier', 'result'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.currentNonceGauge) {
      ApiMetricsService.currentNonceGauge = new Gauge({
        name: 'current_nonce',
        help: 'Current nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.lastProcessedNonceGauge) {
      ApiMetricsService.lastProcessedNonceGauge = new Gauge({
        name: 'last_processed_nonce',
        help: 'Last processed nonce of the given shard',
        labelNames: ['shardId'],
      });
    }

    if (!ApiMetricsService.pendingApiHitGauge) {
      ApiMetricsService.pendingApiHitGauge = new Gauge({
        name: 'pending_api_hits',
        help: 'Number of hits for pending API calls',
        labelNames: ['endpoint'],
      });
    }

    if (!ApiMetricsService.cachedApiHitGauge) {
      ApiMetricsService.cachedApiHitGauge = new Gauge({
        name: 'cached_api_hits',
        help: 'Number of hits for cached API calls',
        labelNames: ['endpoint'],
      });
    }

    if (!ApiMetricsService.isDefaultMetricsRegistered) {
      ApiMetricsService.isDefaultMetricsRegistered = true;
      collectDefaultMetrics();
    }
  }

  setVmQuery(address: string, func: string, duration: number) {
    ApiMetricsService.vmQueriesHistogram.labels(address, func).observe(duration);
  }

  setPendingRequestsCount(count: number) {
    ApiMetricsService.pendingRequestsHistogram.set(count);
  }

  setExternalCall(system: string, duration: number) {
    ApiMetricsService.externalCallsHistogram.labels(system).observe(duration);
  }

  setElasticDuration(collection: string, type: ElasticMetricType, duration: number) {
    ApiMetricsService.elasticDurationHistogram.labels(type, collection).observe(duration);
  }

  setGatewayDuration(name: string, duration: number) {
    ApiMetricsService.gatewayDurationHistogram.labels(name).observe(duration);
  }

  setRedisDuration(action: string, duration: number) {
    ApiMetricsService.externalCallsHistogram.labels('redis').observe(duration);
    ApiMetricsService.redisDurationHistogram.labels(action).observe(duration);
  }

  setPersistenceDuration(action: string, duration: number) {
    ApiMetricsService.externalCallsHistogram.labels('persistence').observe(duration);
    ApiMetricsService.persistenceDurationHistogram.labels(action).observe(duration);
  }

  static setJobResult(job: string, result: 'success' | 'error', duration: number) {
    ApiMetricsService.jobsHistogram.labels(job, result).observe(duration);
  }

  setLastProcessedNonce(shardId: number, nonce: number) {
    ApiMetricsService.lastProcessedNonceGauge.set({ shardId }, nonce);
  }

  incrementPendingApiHit(endpoint: string) {
    ApiMetricsService.pendingApiHitGauge.inc({ endpoint });
  }

  incrementCachedApiHit(endpoint: string) {
    ApiMetricsService.cachedApiHitGauge.inc({ endpoint });
  }

  async getMetrics(): Promise<string> {
    const shardIds = await this.protocolService.getShardIds();
    if (this.apiConfigService.getIsTransactionProcessorCronActive()) {
      const currentNonces = await this.getCurrentNonces();
      for (const [index, shardId] of shardIds.entries()) {
        ApiMetricsService.currentNonceGauge.set({ shardId }, currentNonces[index]);
      }
    }

    return register.metrics();
  }

  private async getCurrentNonces(): Promise<number[]> {
    const shardIds = await this.protocolService.getShardIds();
    return await Promise.all(
      shardIds.map(shardId => this.getCurrentNonce(shardId))
    );
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    const shardInfo = await this.gatewayService.get(`network/status/${shardId}`, GatewayComponentRequest.networkStatus);
    return shardInfo.status.erd_nonce;
  }
}
