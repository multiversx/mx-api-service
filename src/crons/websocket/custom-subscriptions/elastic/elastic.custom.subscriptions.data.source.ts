import { Injectable, OnModuleInit } from '@nestjs/common';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { ElasticQuery, ElasticService, ElasticSortOrder, QueryType } from '@multiversx/sdk-nestjs-elastic';
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
import { IndexerRound } from '../entities';

@Injectable()
export class ElasticCustomSubscriptionsDataSource implements OnModuleInit {
  private readonly logger = new OriginLogger(ElasticCustomSubscriptionsDataSource.name);

  private static readonly batchSize = 10000;
  private static readonly maxRetries = 3;
  private static readonly retryDelayMs = 500;
  private static readonly pollingMaxAttempts = 15;
  private static readonly idleDelayMs = 1000;

  constructor(
    private readonly broadcaster: CustomSubscriptionsBroadcaster,
    private readonly indexerService: IndexerService,
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly cacheService: CacheService,
  ) { }

  onModuleInit() {
    void this.processRoundsForever();
  }

  private async processRoundsForever(): Promise<void> {
    while (true) {
      try {
        await this.processNextRound();
      } catch (error) {
        this.logger.error('Could not process the next custom subscriptions round');
        this.logger.error(error);
        await this.sleep(ElasticCustomSubscriptionsDataSource.idleDelayMs);
      }
    }
  }

  async processNextRound(): Promise<void> {
    if (!this.broadcaster.hasSubscriptions()) {
      this.cacheService.deleteLocal(CacheInfo.WsTimestampMsToProcess().key);
      await this.sleep(ElasticCustomSubscriptionsDataSource.idleDelayMs);
      return;
    }

    const networkConfig = await this.cacheService.getOrSetLocal(
      CacheInfo.WsNetworkConfig.key,
      async () => await this.gatewayService.getNetworkConfig(),
      CacheInfo.WsNetworkConfig.ttl,
    );
    const stats = new Stats({ shards: networkConfig.erd_num_shards_without_meta, refreshRate: networkConfig.erd_round_duration });

    const roundToProcessTimestampMs = await this.cacheService.getOrSetLocal(
      CacheInfo.WsTimestampMsToProcess().key,
      async () => await this.getLatestRoundOnChainTimestampMs(),
      CacheInfo.WsTimestampMsToProcess().ttl,
    );

    await this.sleepUntil(roundToProcessTimestampMs + stats.refreshRate, stats.refreshRate);

    const pollingDelay = stats.refreshRate / 10;
    const isRoundAvailable = await this.pollUntil(async () => await this.isElasticDataAvailableForTimestampMs(roundToProcessTimestampMs, stats), pollingDelay, ElasticCustomSubscriptionsDataSource.pollingMaxAttempts);
    if (!isRoundAvailable) {
      return;
    }

    const roundDataRaw = await this.fetchRoundDataRaw(roundToProcessTimestampMs);

    await this.broadcaster.broadcast(roundDataRaw);

    this.cacheService.setLocal(
      CacheInfo.WsTimestampMsToProcess().key,
      roundToProcessTimestampMs + stats.refreshRate,
      CacheInfo.WsTimestampMsToProcess().ttl,
    );
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

  private async getLatestRoundOnChainTimestampMs(): Promise<number> {
    const elasticQuery = ElasticQuery.create().
      withSort([
        { name: 'timestampMs', order: ElasticSortOrder.descending, missing: 0 },
        { name: "timestamp", order: ElasticSortOrder.descending },
      ])
      .withPagination({ from: 0, size: 1 })
      .withFields(['timestampMs', 'timestamp']);

    const [latestRound] = await this.elasticService.getList('rounds', 'round', elasticQuery);

    return latestRound.timestampMs ?? latestRound.timestamp * 1000;
  }

  private async isElasticDataAvailableForTimestampMs(timestampMs: number, networkStats: Stats) {
    const nextRoundTimestampMs = timestampMs + networkStats.refreshRate;

    const rounds = await this.elasticService.getCount(
      'rounds',
      ElasticQuery.create().withMustCondition(QueryType.Match('timestampMs', nextRoundTimestampMs))
    );

    return rounds === networkStats.shards + 1; // +1 for metachain
  }

  private async pollUntil(conditionFn: () => Promise<boolean>, intervalMs: number, maxAttempts: number): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (await conditionFn()) {
        return true;
      }

      await this.sleep(intervalMs);
    }

    return false;
  }

  private async sleepUntil(timestampMs: number, maxDelayMs: number): Promise<void> {
    const delayMs = timestampMs - Date.now();
    // if not, the round is already late or network time is desynchronized
    if (delayMs > 0 && delayMs <= maxDelayMs) {
      await this.sleep(delayMs);
    }
  }

  private async sleep(delayMs: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
