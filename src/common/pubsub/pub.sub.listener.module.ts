import { Module } from '@nestjs/common';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { WebSocketPublisherModule } from 'src/websockets/web-socket-publisher-module';
import { ApiConfigService } from '../api-config/api.config.service';
import { PubSubListenerController } from './pub.sub.listener.controller';

@Module({
  imports: [
    DynamicModuleUtils.getCachingModule(),
    WebSocketPublisherModule,
  ],
  controllers: [
    PubSubListenerController,
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
  exports: ['PUBSUB_SERVICE'],
})
export class PubSubListenerModule { }
