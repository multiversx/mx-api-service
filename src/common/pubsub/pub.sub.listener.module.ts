import { Module } from '@nestjs/common';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { WebSocketPublisherModule } from 'src/common/websockets/web-socket-publisher-module';
import { PubSubListenerController } from './pub.sub.listener.controller';

@Module({
  imports: [
    DynamicModuleUtils.getCacheModule(),
    WebSocketPublisherModule,
  ],
  controllers: [
    PubSubListenerController,
  ],
  providers: [
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: ['PUBSUB_SERVICE'],
})
export class PubSubListenerModule { }
