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
import { ExtendedCron } from "./decorators/extended-cron.decorator";
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

  @ExtendedCron('*/600 * * * * * *') // each 600ms
  @Lock({ name: 'Push transactions to subscribers', verbose: true })
  async handleTransactionsUpdate() {
    await this.transactionsGateway.pushTransactions();
  }

  @ExtendedCron('*/600 * * * * * *') // each 600ms
  @Lock({ name: 'Push blocks to subscribers', verbose: true })
  async handleBlocksUpdate() {
    await this.blocksGateway.pushBlocks();
  }

  @ExtendedCron('*/600 * * * * * *') // each 600ms
  @Lock({ name: 'Push stats to subscribers', verbose: true })
  async handleStatsUpdate() {
    await this.networkGateway.pushStats();
  }

  @ExtendedCron('*/600 * * * * * *') // each 600ms
  @Lock({ name: 'Push pool transactions to subscribers', verbose: true })
  async handlePoolTransactions() {
    await this.poolGateway.pushPool();
  }

  @ExtendedCron('*/600 * * * * * *') // each 600ms
  @Lock({ name: 'Push events to subscribers', verbose: true })
  async handleEventsUpdate() {
    await this.eventsGateway.pushEvents();
  }
}
