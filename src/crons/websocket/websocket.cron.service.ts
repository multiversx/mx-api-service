import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsGateway } from './transaction.gateway';
import { BlocksGateway } from 'src/crons/websocket/blocks.gateway';
import { NetworkGateway } from 'src/crons/websocket/network.gateway';
import { Lock } from "@multiversx/sdk-nestjs-common";
import { PoolGateway } from 'src/crons/websocket/pool.gateway';
import { EventsGateway } from 'src/crons/websocket/events.gateway';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { Server } from 'socket.io';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/utils/cache.info';
import { RoundService } from 'src/endpoints/rounds/round.service';
import { RoundFilter } from 'src/endpoints/rounds/entities/round.filter';
import { ElasticQuery, ElasticService, QueryType } from '@multiversx/sdk-nestjs-elastic';
import { NetworkService } from 'src/endpoints/network/network.service';
import { Stats } from 'src/endpoints/network/entities/stats';
import { TransactionsCustomGateway } from './transaction.custom.gateway';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class WebsocketCronService {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly transactionsGateway: TransactionsGateway,
    private readonly blocksGateway: BlocksGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly poolGateway: PoolGateway,
    private readonly eventsGateway: EventsGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly cacheService: CacheService,
    private readonly roundService: RoundService,
    private readonly elasticService: ElasticService,
    private readonly networkService: NetworkService,
    private readonly transactionsCustomGateway: TransactionsCustomGateway,
  ) { }

  @Cron('*/1 * * * * *')
  handleWebsocketMetrics() {
    const connectedClients = this.server.sockets.sockets.size ?? 0;
    // TODO: add more metrics in the future
    // const subscriptions: Record<string, number> = {};

    // this.server.sockets.adapter.rooms.forEach((socketsSet, roomName) => {
    //   subscriptions[roomName] = socketsSet.size;
    // });

    this.eventEmitter.emit(MetricsEvents.SetWebsocketMetrics, {
      connectedClients,
    });
  }

  @Cron('*/6 * * * * *')
  @Lock({ name: 'Push transactions to subscribers', verbose: true })
  async handleTransactionsUpdate() {
    await this.transactionsGateway.pushTransactions();
  }

  @Cron('*/6 * * * * *')
  @Lock({ name: 'Push blocks to subscribers', verbose: true })
  async handleBlocksUpdate() {
    await this.blocksGateway.pushBlocks();
  }

  @Cron('*/6 * * * * *')
  @Lock({ name: 'Push stats to subscribers', verbose: true })
  async handleStatsUpdate() {
    await this.networkGateway.pushStats();
  }

  @Cron('*/6 * * * * *')
  @Lock({ name: 'Push pool transactions to subscribers', verbose: true })
  async handlePoolTransactions() {
    await this.poolGateway.pushPool();
  }

  @Cron('*/6 * * * * *')
  @Lock({ name: 'Push events to subscribers', verbose: true })
  async handleEventsUpdate() {
    await this.eventsGateway.pushEvents();
  }

  @Cron('*/3 * * * * *')
  @Lock({ name: 'Push custom transactions to subscribers', verbose: true })
  async handleCustomTransactionsUpdate() {
    const latestRoundOnChainData = await this.getLatestRoundOnChainData();

    let roundToProcessTimestampMs = await this.cacheService.getOrSetLocal(
      CacheInfo.WsTimestampMsToProcess().key,
      async () => latestRoundOnChainData.timestampMs ?? latestRoundOnChainData.timestamp * 1000,
      CacheInfo.WsTimestampMsToProcess().ttl,
    );

    const stats = await this.networkService.getStats();

    const pollingDelay = stats.refreshRate / 2;
    const pollingMaxAttempts = 10;
    while (roundToProcessTimestampMs <= latestRoundOnChainData.timestampMs) {
      await this.pollUntil(async () => this.isElasticDataAvailableForTimestampMs(roundToProcessTimestampMs, stats), pollingDelay, pollingMaxAttempts);

      // call gateways to process logic for custom subscriptions
      await this.transactionsCustomGateway.pushTransactionsForTimestampMs(roundToProcessTimestampMs);
      roundToProcessTimestampMs += stats.refreshRate;
    }
    this.cacheService.setLocal(
      CacheInfo.WsTimestampMsToProcess().key,
      roundToProcessTimestampMs,
      CacheInfo.WsTimestampMsToProcess().ttl,
    );
  }

  private async getLatestRoundOnChainData() {
    const rounds = await this.roundService.getRounds(new RoundFilter({ size: 1 }));
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

  async pollUntil(conditionFn: () => Promise<boolean>, intervalMs = 1000, maxAttempts = 30) {
    let attempts = 0;
    while (!await conditionFn()) {
      if (++attempts >= maxAttempts) throw new Error('Polling timeout exceeded');
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }
}
