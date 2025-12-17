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
import { EventsGateway } from './events.gateway';
import { ConnectionHandler } from './connection.handler';
import { RoundModule } from 'src/endpoints/rounds/round.module';
import { TransactionsCustomGateway } from './transaction.custom.gateway';
import { EventsCustomGateway } from './events.custom.gateway';
import { ApiConfigModule } from 'src/common/api-config/api.config.module';
import { TransfersCustomGateway } from './transfers.custom.gateway';
import { TransferModule } from 'src/endpoints/transfers/transfer.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TransactionModule,
    BlockModule,
    NetworkModule,
    PoolModule,
    EventsModule,
    RoundModule,
    TransferModule,
    ApiConfigModule,
  ],
  providers: [
    WebsocketCronService,
    ConnectionHandler,
    BlocksGateway,
    NetworkGateway,
    TransactionsGateway,
    PoolGateway,
    EventsGateway,
    TransactionsCustomGateway,
    EventsCustomGateway,
    TransfersCustomGateway,
  ],
})
export class WebsocketSubscriptionModule { }
