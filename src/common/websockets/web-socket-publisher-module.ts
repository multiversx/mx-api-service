import { Module } from "@nestjs/common";
import { TransactionActionModule } from "src/endpoints/transactions/transaction-action/transaction.action.module";
import { WebSocketPublisherService } from "./web-socket-publisher-service";

@Module({
  imports: [
    TransactionActionModule,
  ],
  providers: [
    WebSocketPublisherService,
  ],
  exports: [
    WebSocketPublisherService,
  ],
})
export class WebSocketPublisherModule { }
