import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { WebsocketCronService } from './websocket.cron.service';
import { BlockModule } from 'src/endpoints/blocks/block.module';
import { NetworkModule } from 'src/endpoints/network/network.module';
import { PoolModule } from 'src/endpoints/pool/pool.module';
import { EventsModule } from 'src/endpoints/events/events.module';
import { BlocksGateway } from './blocks.gateway';
import { NetworkGateway } from './network.gateway';
import { TransactionsGateway } from './transaction.gateway';
import { PoolGateway } from './pool.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TransactionModule,
    BlockModule,
    NetworkModule,
    PoolModule,
    EventsModule,
  ],
  providers: [
    WebsocketCronService,
    BlocksGateway,
    NetworkGateway,
    TransactionsGateway,
    PoolGateway,
  ],
})
export class WebsocketSubscriptionModule { }
