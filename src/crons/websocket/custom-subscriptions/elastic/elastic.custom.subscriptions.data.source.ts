import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Locker, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { ElasticQuery, ElasticService, ElasticSortOrder, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { Operation } from 'src/common/indexer/entities';
import { Events as IndexerEvents } from 'src/common/indexer/entities/events';
import { IndexerService } from 'src/common/indexer/indexer.service';
import { EventsFilter } from 'src/endpoints/events/entities/events.filter';
import { Stats } from 'src/endpoints/network/entities/stats';
import { TransactionFilter } from 'src/endpoints/transactions/entities/transaction.filter';
import { CacheInfo } from 'src/utils/cache.info';
import { RetryUtils } from 'src/utils/retry.utils';
import { CustomSubscriptionsBroadcaster } from '../custom.subscriptions.broadcaster';
import { IndexerRound } from '../indexer.round';

@Injectable()
export class ElasticCustomSubscriptionsDataSource implements OnModuleInit {
  private readonly logger = new OriginLogger(ElasticCustomSubscriptionsDataSource.name);

  private static readonly batchSize = 10000;
  private static readonly maxRetries = 3;
  private static readonly retryDelayMs = 500;
  private static readonly pollingMaxAttempts = 15;

  constructor(
    private readonly broadcaster: CustomSubscriptionsBroadcaster,
    private readonly indexerService: IndexerService,
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly cacheService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }

  onModuleInit() {
    const interval = setInterval(async () => {
      await Locker.lock('Push custom data to subscribers', async () => {
        await this.processRounds();
      }, true);
    }, this.apiConfigService.getWebsocketSubscriptionBroadcastIntervalMs());

    this.schedulerRegistry.addInterval('push-custom-data', interval);
  }

  async processRounds(): Promise<void> {
    if (!this.broadcaster.hasSubscriptions()) {
      this.cacheService.deleteLocal(CacheInfo.WsTimestampMsToProcess().key);
      return;
    }

    const networkConfig = await this.gatewayService.getNetworkConfig();
    const stats = new Stats({ shards: networkConfig.erd_num_shards_without_meta, refreshRate: networkConfig.erd_round_duration });

    const latestRoundOnChainTimestamp = await this.getLatestRoundOnChainTimestamp();
    const latestRoundOnChainTimestampMs = latestRoundOnChainTimestamp.timestampMs ?? latestRoundOnChainTimestamp.timestamp * 1000;

    let roundToProcessTimestampMs = await this.cacheService.getOrSetLocal(
      CacheInfo.WsTimestampMsToProcess().key,
      () => Promise.resolve(latestRoundOnChainTimestampMs),
      CacheInfo.WsTimestampMsToProcess().ttl,
    );

    const pollingDelay = stats.refreshRate / 10;
    while (roundToProcessTimestampMs <= latestRoundOnChainTimestampMs) {
      await this.pollUntil(async () => await this.isElasticDataAvailableForTimestampMs(roundToProcessTimestampMs, stats), pollingDelay, ElasticCustomSubscriptionsDataSource.pollingMaxAttempts);

      const roundDataRaw = await this.fetchRoundDataRaw(roundToProcessTimestampMs);

      await this.broadcaster.broadcast(roundDataRaw);

      roundToProcessTimestampMs += stats.refreshRate;
      this.cacheService.setLocal(
        CacheInfo.WsTimestampMsToProcess().key,
        roundToProcessTimestampMs,
        CacheInfo.WsTimestampMsToProcess().ttl,
      );
    }
  }

  async fetchRoundDataRaw(timestampMs: number): Promise<IndexerRound> {
    const [operations, events] = await Promise.all([
      this.withRetries(`transfers for timestamp '${timestampMs}'`, () => this.fetchOperationsRaw(timestampMs)),
      this.withRetries(`events for timestamp '${timestampMs}'`, () => this.fetchEventsRaw(timestampMs)),
    ]);

    return new IndexerRound({ timestampMs, operations, events });
  }

  // after the last retry the round goes on without this data, so a persistent error does not block the next rounds
  private async withRetries<T>(description: string, fetch: () => Promise<T[]>): Promise<T[]> {
    const maxRetries = ElasticCustomSubscriptionsDataSource.maxRetries;

    try {
      return await RetryUtils.retry(
        fetch,
        maxRetries,
        ElasticCustomSubscriptionsDataSource.retryDelayMs,
        retry => this.logger.warn(`Could not fetch ${description}, retrying (${retry}/${maxRetries})`),
      );
    } catch (error) {
      this.logger.error(`Could not fetch ${description} after ${maxRetries} retries, skipping it`);
      this.logger.error(error);
      return [];
    }
  }

  private async fetchOperationsRaw(timestampMs: number): Promise<Operation[]> {
    const size = ElasticCustomSubscriptionsDataSource.batchSize;
    const filter = new TransactionFilter({ before: timestampMs, after: timestampMs, withTxsRelayedByAddress: true });

    const operations: Operation[] = [];

    let batch = await this.indexerService.getTransfers(filter, new QueryPagination({ size }));
    operations.push(...batch);

    while (batch.length === size) {
      const searchAfter = batch[batch.length - 1].searchAfter;
      if (searchAfter == null) {
        break;
      }

      batch = await this.indexerService.getTransfers(filter, new QueryPagination({ size, searchAfter }));

      operations.push(...batch);
    }

    return operations;
  }

  private async fetchEventsRaw(timestampMs: number): Promise<IndexerEvents[]> {
    const size = ElasticCustomSubscriptionsDataSource.batchSize;
    const filter = new EventsFilter({ before: timestampMs, after: timestampMs });

    const events: IndexerEvents[] = [];

    let batch: any[] = await this.indexerService.getEvents(new QueryPagination({ size }), filter);
    events.push(...batch);

    while (batch.length === size) {
      const searchAfter = batch[batch.length - 1].searchAfter;
      if (searchAfter == null) {
        break;
      }

      batch = await this.indexerService.getEvents(new QueryPagination({ size, searchAfter }), filter);

      events.push(...batch);
    }

    return events;
  }

  private async getLatestRoundOnChainTimestamp(): Promise<{ timestampMs?: number; timestamp: number }> {
    const elasticQuery = ElasticQuery.create().
      withSort([
        { name: 'timestampMs', order: ElasticSortOrder.descending, missing: 0 },
        { name: "timestamp", order: ElasticSortOrder.descending },
      ])
      .withPagination({ from: 0, size: 1 })
      .withFields(['timestampMs', 'timestamp']);

    const rounds = await this.elasticService.getList('rounds', 'round', elasticQuery);

    return rounds[0];
  }

  private async isElasticDataAvailableForTimestampMs(timestampMs: number, networkStats: Stats) {
    const nextRoundTimestampMs = timestampMs + networkStats.refreshRate;

    const rounds = await this.elasticService.getCount(
      'rounds',
      ElasticQuery.create().withMustCondition(QueryType.Match('timestampMs', nextRoundTimestampMs))
    );

    return rounds === networkStats.shards + 1; // +1 for metachain
  }

  private async pollUntil(conditionFn: () => Promise<boolean>, intervalMs = 1000, maxAttempts = 30) {
    let attempts = 0;
    while (!await conditionFn()) {
      if (++attempts >= maxAttempts) throw new Error('Polling timeout exceeded');
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
}
