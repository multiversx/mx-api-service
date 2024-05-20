import { CacheService, RedisCacheService } from "@multiversx/sdk-nestjs-cache";
import { Injectable } from "@nestjs/common";
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ProtocolService } from "src/common/protocol/protocol.service";
import { CacheInfo } from "src/utils/cache.info";
import { Lock, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { CronJob } from "cron";
import { TpsUtils } from "src/utils/tps.utils";
import { TpsService } from "src/endpoints/tps/tps.service";
import { TpsInterval } from "src/endpoints/tps/entities/tps.interval";

@Injectable()
export class TpsWarmerService {
  private readonly logger = new OriginLogger(TpsWarmerService.name);

  constructor(
    private readonly cachingService: CacheService,
    private readonly redisCacheService: RedisCacheService,
    private readonly protocolService: ProtocolService,
    private readonly apiConfigService: ApiConfigService,
    private readonly gatewayService: GatewayService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly tpsService: TpsService,
  ) {
    if (!this.apiConfigService.isTpsEnabled()) {
      return;
    }

    const handleBlockProcessorCronJob = new CronJob(CronExpression.EVERY_SECOND, async () => await this.handleBlockProcessor());
    this.schedulerRegistry.addCronJob('handleBlockProcessor', handleBlockProcessorCronJob);
    handleBlockProcessorCronJob.start();

    const refreshTpsHistoryCronJob = new CronJob(CronExpression.EVERY_10_SECONDS, async () => await this.refreshTpsHistory());
    this.schedulerRegistry.addCronJob('refreshTpsHistory', refreshTpsHistoryCronJob);
    refreshTpsHistoryCronJob.start();
  }

  @Lock({ name: 'Block Processor', verbose: true })
  async handleBlockProcessor() {
    const shardCount = await this.protocolService.getShardCount();
    const metaChainShardId = this.apiConfigService.getMetaChainShardId();

    const shards = [...Array.from({ length: shardCount }, (_, i) => i), metaChainShardId];

    await Promise.all(shards.map(shardId => this.processTpsForShard(shardId)));
  }

  @Lock({ name: 'Refresh TPS History', verbose: true })
  async refreshTpsHistory() {
    const intervals = [TpsInterval._1h, TpsInterval._1d];

    for (const interval of intervals) {
      const tpsHistory = await this.tpsService.getTpsHistoryRaw(interval);

      await this.cachingService.setRemote(CacheInfo.TpsHistoryByInterval(interval).key, tpsHistory);
    }
  }

  private async processTpsForShard(shardId: number) {
    const endNonce = await this.getEndNonce(shardId);
    const startNonce = await this.getStartNonce(shardId, endNonce);

    for (let nonce = startNonce + 1; nonce <= endNonce; nonce++) {
      this.logger.log(`Processing TPS for shard ${shardId} and nonce ${nonce}. Nonces to process: ${endNonce - nonce}`);
      await this.processTpsForShardAndNonce(shardId, nonce);

      await this.cachingService.setRemote(CacheInfo.TpsNonceByShard(shardId).key, nonce);
    }
  }

  private async getStartNonce(shardId: number, endNonce: number): Promise<number> {
    const startNonce = await this.cachingService.getRemote<number>(CacheInfo.TpsNonceByShard(shardId).key);
    if (!startNonce) {
      return endNonce - this.apiConfigService.getTpsMaxLookBehindNonces();
    }

    if (startNonce < endNonce - this.apiConfigService.getTpsMaxLookBehindNonces()) {
      return endNonce - this.apiConfigService.getTpsMaxLookBehindNonces();
    }

    return startNonce;
  }

  private async getEndNonce(shardId: number): Promise<number> {
    const networkStatus = await this.gatewayService.getNetworkStatus(shardId);
    return networkStatus.erd_nonce;
  }

  private async processTpsForShardAndNonce(shardId: number, nonce: number) {
    const block = await this.gatewayService.getBlockByShardAndNonce(shardId, nonce);
    const transactionCount: number = block.numTxs;
    const timestamp: number = block.timestamp;
    this.logger.log(`Processing TPS for shard ${shardId} and nonce ${nonce}. Transactions: ${transactionCount} Timestamp: ${timestamp}`);

    for (const frequency of TpsUtils.Frequencies) {
      await this.saveTps(timestamp, frequency, transactionCount);
    }
  }

  private async saveTps(timestamp: number, frequency: number, transactionCount: number) {
    const timestampByFrequency = TpsUtils.getTimestampByFrequency(timestamp, frequency);

    const key = CacheInfo.TpsByTimestampAndFrequency(timestampByFrequency, frequency).key;

    const transactionCountAfterIncrement = await this.redisCacheService.incrby(key, transactionCount);
    if (transactionCountAfterIncrement === transactionCount) {
      await this.redisCacheService.expire(key, CacheInfo.TpsByTimestampAndFrequency(timestampByFrequency, frequency).ttl);
    }
  }
}
