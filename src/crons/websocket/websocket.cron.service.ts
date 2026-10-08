import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { TransactionsGateway } from './transaction.gateway';
import { BlocksGateway } from 'src/crons/websocket/blocks.gateway';
import { NetworkGateway } from 'src/crons/websocket/network.gateway';
import { Lock, Locker } from "@multiversx/sdk-nestjs-common";
import { PoolGateway } from 'src/crons/websocket/pool.gateway';
import { EventsGateway } from 'src/crons/websocket/events.gateway';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MetricsEvents } from 'src/utils/metrics-events.constants';
import { Server } from 'socket.io';
import { TransactionsCustomGateway } from './transaction.custom.gateway';
import { EventsCustomGateway } from './events.custom.gateway';
import { TransfersCustomGateway } from './transfers.custom.gateway';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, path: '/ws/subscription' })
export class WebsocketCronService implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly transactionsGateway: TransactionsGateway,
    private readonly blocksGateway: BlocksGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly poolGateway: PoolGateway,
    private readonly eventsGateway: EventsGateway,
    private readonly eventEmitter: EventEmitter2,
    private readonly apiConfigService: ApiConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) { }


  onModuleInit() {
    const intervalMs = this.apiConfigService.getWebsocketSubscriptionBroadcastIntervalMs();

    this.registerDynamicInterval(
      'push-transactions',
      intervalMs,
      'Push transactions to subscribers',
      () => this.handleTransactionsUpdate()
    );

    this.registerDynamicInterval(
      'push-blocks',
      intervalMs,
      'Push blocks to subscribers',
      () => this.handleBlocksUpdate()
    );

    this.registerDynamicInterval(
      'push-stats',
      intervalMs,
      'Push stats to subscribers',
      () => this.handleStatsUpdate()
    );

    this.registerDynamicInterval(
      'push-pool',
      intervalMs,
      'Push pool transactions to subscribers',
      () => this.handlePoolUpdate()
    );

    this.registerDynamicInterval(
      'push-events',
      intervalMs,
      'Push events to subscribers',
      () => this.handleEventsUpdate()
    );
  }

  private registerDynamicInterval(name: string, ms: number, lockMessage: string, callback: () => Promise<void>) {
    const interval = setInterval(async () => {
      await Locker.lock(lockMessage, async () => {
        await callback();
      }, true);
    }, ms);

    this.schedulerRegistry.addInterval(name, interval);
  }

  async handleTransactionsUpdate() {
    await this.transactionsGateway.pushTransactions();
  }

  async handleBlocksUpdate() {
    await this.blocksGateway.pushBlocks();
  }

  async handleStatsUpdate() {
    await this.networkGateway.pushStats();
  }

  async handlePoolUpdate() {
    await this.poolGateway.pushPool();
  }


  async handleEventsUpdate() {
    await this.eventsGateway.pushEvents();
  }

  @Cron('*/10 * * * * *')
  @Lock({ name: 'Push websocket subscriptions metrics', verbose: true })
  handleWebsocketMetrics() {
    const connectedClients = this.server.sockets.sockets.size ?? 0;

    // Efficient unique-listener counts per topic
    const adapter = this.server.sockets.adapter as any;
    const sids: Map<string, Set<string>> = adapter?.sids ?? new Map();

    const topicPrefixes: Array<{ key: string; prefix?: string; room?: string }> = [
      { key: 'tx', prefix: TransactionsGateway.keyPrefix },
      { key: 'customTx', prefix: TransactionsCustomGateway.keyPrefix },
      { key: 'events', prefix: EventsGateway.keyPrefix },
      { key: 'customEvents', prefix: EventsCustomGateway.keyPrefix },
      { key: 'customTransfers', prefix: TransfersCustomGateway.keyPrefix },
      { key: 'blocks', prefix: BlocksGateway.keyPrefix },
      { key: 'pool', prefix: PoolGateway.keyPrefix },
      { key: 'stats', room: 'statsRoom' },
    ];

    const topics: Record<string, number> = {};
    for (const { key } of topicPrefixes) topics[key] = 0;

    // Count unique sockets per prefix-based topic by scanning socket -> rooms map once
    if (sids && sids.size > 0) {
      for (const [, rooms] of sids) {
        // Track whether this socket has been counted for a given topic key
        const matched: Record<string, boolean> = {};

        for (const roomName of rooms) {
          for (const { key, prefix } of topicPrefixes) {
            if (!prefix || matched[key]) continue;
            if (roomName.startsWith(prefix)) {
              topics[key] += 1;
              matched[key] = true;
            }
          }
        }
      }
    }

    // Handle exact-room topics (like statsRoom) directly from rooms map
    const rooms: Map<string, Set<string>> = adapter?.rooms ?? new Map();
    const statsRoomSet = rooms.get('statsRoom');
    if (statsRoomSet) {
      topics['stats'] = statsRoomSet.size;
    }

    this.eventEmitter.emit(MetricsEvents.SetWebsocketMetrics, {
      connectedClients,
      topics,
    });
  }
}
