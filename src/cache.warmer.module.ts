import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from 'config/configuration';
import { CacheWarmerService } from './crons/cache.warmer.service';
import { PublicAppModule } from './public.app.module';

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
    CacheWarmerService
  ],
})
export class CacheWarmerModule {}
