import { Module } from '@nestjs/common';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigService } from './common/api-config/api.config.service';
import { CacheController } from './common/caching/cache.controller';
import { LoggingModule } from './common/logging/logging.module';
import { MetricsController } from './common/metrics/metrics.controller';
import { HealthCheckController } from './endpoints/health-check/health.check.controller';
import { ProcessNftsController } from './endpoints/process-nfts/process.nfts.controller';
import { ProcessNftsModule } from './endpoints/process-nfts/process.nfts.module';

@Module({
  imports: [
    LoggingModule,
    ProcessNftsModule,
  ],
  providers: [
    {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfigService: ApiConfigService) => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            url: `redis://${apiConfigService.getRedisUrl()}:6379`,
            retryDelay: 1000,
            retryAttempts: 10,
            retry_strategy: function (_: any) {
              return 1000;
            },
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ApiConfigService],
    },
  ],
  controllers: [
    MetricsController,
    CacheController,
    HealthCheckController,
    ProcessNftsController,
  ],
})
export class PrivateAppModule { }
