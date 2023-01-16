import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { ApiConfigModule } from '../api-config/api.config.module';
import { ApiConfigService } from '../api-config/api.config.service';
import { RabbitMqConsumer } from './rabbitmq.consumer';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';
import { RabbitMqEventsHandlerService } from './rabbitmq.events.handler.service';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    ApiConfigModule,
    NftModule,
    NftWorkerModule,
    EventsModule,
  ],
  providers: [
    RabbitMqConsumer,
    RabbitMqNftHandlerService,
    RabbitMqEventsHandlerService,
  ],
})
export class RabbitMqModule {
  static register(): DynamicModule {
    return {
      module: RabbitMqModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          imports: [ApiConfigModule],
          inject: [ApiConfigService],
          useFactory: (apiConfigService: ApiConfigService) => {
            return {
              name: apiConfigService.getEventsNotifierExchange(),
              type: 'fanout',
              options: {},
              uri: apiConfigService.getEventsNotifierUrl(),
            };
          },
        }),
      ],
    };
  }
}
