import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TransactionsGateway } from './transaction.gateway';
import { BlocksGateway } from 'src/crons/websocket/blocks.gateway';
import { NetworkGateway } from 'src/crons/websocket/network.gateway';
import { Lock } from "@multiversx/sdk-nestjs-common";
import { PoolGateway } from 'src/crons/websocket/pool.gateway';
import { EventsGateway } from 'src/crons/websocket/events.gateway';
@Injectable()
export class WebsocketCronService {
  constructor(
    private readonly transactionsGateway: TransactionsGateway,
    private readonly blocksGateway: BlocksGateway,
    private readonly networkGateway: NetworkGateway,
    private readonly poolGateway: PoolGateway,
    private readonly eventsGateway: EventsGateway,
  ) { }

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
}
