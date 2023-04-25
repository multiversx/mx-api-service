import { Module } from "@nestjs/common";
import { TransactionActionModule } from "src/endpoints/transactions/transaction-action/transaction.action.module";
import { WebSocketPublisherService } from "./web-socket-publisher-service";
import { WebSocketPublisherController } from "./web-socket-publisher-controller";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";

@Module({
  imports: [
    TransactionActionModule,
  ],
  controllers: [
    WebSocketPublisherController,
  ],
  providers: [
    WebSocketPublisherService,
    DynamicModuleUtils.getPubSubService(),
  ],
  exports: [
    WebSocketPublisherService,
    'PUBSUB_SERVICE',
  ],
})
export class WebSocketPublisherModule { }
