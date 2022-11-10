import { MetricsService } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { register, Histogram, Gauge } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";
import { OnEvent } from "@nestjs/event-emitter";
import { LogMetricsEvent } from "./events/log-metrics.event";

@Injectable()
export class ApiMetricsService {
  private static vmQueriesHistogram: Histogram<string>;
  private static gatewayDurationHistogram: Histogram<string>;
  private static persistenceDurationHistogram: Histogram<string>;
  private static indexerDurationHistogram: Histogram<string>;
  private static graphqlDurationHistogram: Histogram<string>;
  private static currentNonceGauge: Gauge<string>;
  private static lastProcessedNonceGauge: Gauge<string>;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => GatewayService))
    private readonly gatewayService: GatewayService,
    @Inject(forwardRef(() => ProtocolService))
    private readonly protocolService: ProtocolService,
    private readonly metricsService: MetricsService,
  ) {

    if (!ApiMetricsService.vmQueriesHistogram) {
      ApiMetricsService.vmQueriesHistogram = new Histogram({
        name: 'vm_query',
        help: 'VM Queries',
        labelNames: ['address', 'function'],
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

    if (!ApiMetricsService.persistenceDurationHistogram) {
      ApiMetricsService.persistenceDurationHistogram = new Histogram({
        name: 'persistence_duration',
        help: 'Persistence Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.indexerDurationHistogram) {
      ApiMetricsService.indexerDurationHistogram = new Histogram({
        name: 'indexer_duration',
        help: 'Indexer Duration',
        labelNames: ['action'],
        buckets: [],
      });
    }

    if (!ApiMetricsService.graphqlDurationHistogram) {
      ApiMetricsService.graphqlDurationHistogram = new Histogram({
        name: 'query_duration',
        help: 'The time it takes to resolve a query',
        labelNames: ['query'],
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
  }

  @OnEvent('setVmQuery')
  setVmQuery(payload: LogMetricsEvent) {
    const [address, func, duration] = payload.args;
    ApiMetricsService.vmQueriesHistogram.labels(address, func).observe(duration);
  }

  @OnEvent('setGatewayDuration')
  setGatewayDuration(payload: LogMetricsEvent) {
    const [name, duration] = payload.args;
    ApiMetricsService.gatewayDurationHistogram.labels(name).observe(duration);
  }

  @OnEvent('setPersistenceDuration')
  setPersistenceDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('persistence', duration);
    ApiMetricsService.persistenceDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent('setIndexerDuration')
  setIndexerDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('indexer', duration);
    ApiMetricsService.indexerDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent('setGraphqlDuration')
  setGraphqlDuration(payload: LogMetricsEvent) {
    const [action, duration] = payload.args;
    this.metricsService.setExternalCall('graphql', duration);
    ApiMetricsService.graphqlDurationHistogram.labels(action).observe(duration);
  }

  @OnEvent('setLastProcessedNonce')
  setLastProcessedNonce(payload: LogMetricsEvent) {
    const [shardId, nonce] = payload.args;
    ApiMetricsService.lastProcessedNonceGauge.set({ shardId }, nonce);
  }

  async getMetrics(): Promise<string> {
    const shardIds = await this.protocolService.getShardIds();
    if (this.apiConfigService.getIsTransactionProcessorCronActive()) {
      const currentNonces = await this.getCurrentNonces();
      for (const [index, shardId] of shardIds.entries()) {
        ApiMetricsService.currentNonceGauge.set({ shardId }, currentNonces[index]);
      }
    }

    const baseMetrics = await this.metricsService.getMetrics();
    const currentMetrics = await register.metrics();

    return baseMetrics + '\n' + currentMetrics;
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
