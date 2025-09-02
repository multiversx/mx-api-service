import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { WebsocketCronService } from './websocket.cron.service';
import { BlockModule } from 'src/endpoints/blocks/block.module';
import { NetworkModule } from 'src/endpoints/network/network.module';
import { PoolModule } from 'src/endpoints/pool/pool.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TransactionModule,
    BlockModule,
    NetworkModule,
    PoolModule,
  ],
  providers: [
    WebsocketCronService,
  ],
})
export class WebSocketCronModule { }
