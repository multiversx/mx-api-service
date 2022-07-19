import { Module } from "@nestjs/common";

import { SmartContractResultLoader } from "src/graphql/entities/smart.contract.result/smart.contract.result.loader";
import { SmartContractResultResolver } from "src/graphql/entities/smart.contract.result/smart.contract.result.resolver";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";

@Module({
  imports: [TransactionModule],
  providers: [SmartContractResultLoader, SmartContractResultResolver],
})
export class SmartContractResultModule {}
