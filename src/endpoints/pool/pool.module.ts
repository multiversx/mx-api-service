import { Module } from "@nestjs/common";
import { PoolService } from "./pool.service";
import { TransactionActionModule } from "../transactions/transaction-action/transaction.action.module";
import { PoolGateway } from "./pool.gateway";

@Module({
  imports: [
    TransactionActionModule,
  ],
  providers: [
    PoolService, PoolGateway,
  ],
  exports: [
    PoolService, PoolGateway,
  ],
})

export class PoolModule { }
