import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from 'config/configuration';
import { TransactionProcessorService } from './crons/transaction.processor.service';
import { PublicAppModule } from './public.app.module';
import { EventsGateway } from './websockets/events.gateway';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [configuration]
    }),
    PublicAppModule
  ],
  controllers: [],
  providers: [
    TransactionProcessorService, EventsGateway
  ],
})
export class ProcessorModule {}
