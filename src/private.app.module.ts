import { forwardRef, Module } from '@nestjs/common';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigModule } from './common/api.config.module';
import { ApiConfigService } from './common/api.config.service';
import { CachingModule } from './common/caching/caching.module';
import { CacheController } from './endpoints/cache/cache.controller';
import { MetricsController } from './endpoints/metrics/metrics.controller';
import { MetricsModule } from './endpoints/metrics/metrics.module';
import { PubSubModule } from './pub.sub.module';

@Module({
  imports: [
    forwardRef(() => ApiConfigModule),
    forwardRef(() => CachingModule),
    forwardRef(() => MetricsModule),
    PubSubModule,
  ],
  controllers: [
    MetricsController,
    CacheController,
  ],
  providers: [
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
    },
  ],
})
export class PrivateAppModule {}
