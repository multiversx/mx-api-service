import { Module } from "@nestjs/common";
import { TransactionActionModule } from "src/endpoints/transactions/transaction-action/transaction.action.module";
import { WebSocketPublisherService } from "./web-socket-publisher-service";
import { WebSocketPublisherController } from "./web-socket-publisher-controller";
import { DynamicModuleUtils } from "src/utils/dynamic.module.utils";
import { ApiMetricsModule } from 'src/common/metrics/api.metrics.module';
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({ maxListeners: 1 }),
    TransactionActionModule,
    ApiMetricsModule,
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
