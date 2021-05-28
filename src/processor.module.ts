import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from 'config/configuration';
import { CronService } from './crons/cron.service';
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
    CronService, EventsGateway
  ],
})
export class ProcessorModule {}
