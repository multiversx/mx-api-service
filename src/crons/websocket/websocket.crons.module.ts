import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TransactionModule } from 'src/endpoints/transactions/transaction.module';
import { WebsocketCronService } from './websocket.cron.service';
import { BlockModule } from 'src/endpoints/blocks/block.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TransactionModule,
    BlockModule,
  ],
  providers: [
    WebsocketCronService,
  ],
})
export class WebSocketCronModule { }
