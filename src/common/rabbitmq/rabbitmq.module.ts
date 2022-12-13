import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { EsdtModule } from 'src/endpoints/esdt/esdt.module';
import { NftModule } from 'src/endpoints/nfts/nft.module';
import { NftWorkerModule } from 'src/queue.worker/nft.worker/nft.worker.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { ApiConfigModule } from '../api-config/api.config.module';
import { ApiConfigService } from '../api-config/api.config.service';
import { RabbitMqNftConsumer } from './rabbitmq.nft.consumer';
import { RabbitMqNftHandlerService } from './rabbitmq.nft.handler.service';

@Module({
  imports: [
    ApiConfigModule,
    NftModule,
    NftWorkerModule,
    EsdtModule,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
    RabbitMqNftConsumer,
    RabbitMqNftHandlerService,
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
