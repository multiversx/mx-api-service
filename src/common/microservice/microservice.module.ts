import { forwardRef, Module } from '@nestjs/common';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigModule } from '../api-config/api.config.module';
import { ApiConfigService } from '../api-config/api.config.service';
import { CachingModule } from '../caching/caching.module';
import { MicroserviceController } from './microservice.controller';

@Module({
  imports: [
    ApiConfigModule,
    forwardRef(() => CachingModule),
  ],
  controllers: [
    MicroserviceController,
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
    }
  ],
  exports: [ 'PUBSUB_SERVICE' ]
})
export class MicroserviceModule {}
