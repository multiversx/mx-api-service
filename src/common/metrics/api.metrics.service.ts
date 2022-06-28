import { MetricsService } from "@elrondnetwork/nestjs-microservice-common";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { register, Histogram, Gauge } from 'prom-client';
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayComponentRequest } from "../gateway/entities/gateway.component.request";
import { GatewayService } from "../gateway/gateway.service";
import { ProtocolService } from "../protocol/protocol.service";

@Injectable()
export class ApiMetricsService {
  private static vmQueriesHistogram: Histogram<string>;
  private static gatewayDurationHistogram: Histogram<string>;
  private static persistenceDurationHistogram: Histogram<string>;
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

  setVmQuery(address: string, func: string, duration: number) {
    ApiMetricsService.vmQueriesHistogram.labels(address, func).observe(duration);
  }

  setGatewayDuration(name: string, duration: number) {
    ApiMetricsService.gatewayDurationHistogram.labels(name).observe(duration);
  }

  setPersistenceDuration(action: string, duration: number) {
    this.metricsService.setExternalCall('persistence', duration);
    ApiMetricsService.persistenceDurationHistogram.labels(action).observe(duration);
  }

  setLastProcessedNonce(shardId: number, nonce: number) {
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
