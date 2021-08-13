import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from 'config/configuration';
import { CacheWarmerService } from './crons/cache.warmer.service';
import { ApiConfigService } from './common/api.config.service';
import { PublicAppModule } from './public.app.module';
import { InvalidateService } from './common/invalidate.service';

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
    CacheWarmerService,
    InvalidateService,
    {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfigService: ApiConfigService) => {
        let clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            url: `redis://${apiConfigService.getRedisUrl()}:6379`,
            retryDelay: 1000,
            retryAttempts: 10,
            retry_strategy: function(_: any) {
              return 1000;
            },
          }
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ ApiConfigService ]
    }
  ],
})
export class CacheWarmerModule {}
