import { Module } from "@nestjs/common";

import { SmartContractResultLoader } from "src/graphql/entities/smart.contract.result/smart.contract.result.loader";
import { SmartContractResultResolver } from "src/graphql/entities/smart.contract.result/smart.contract.result.resolver";
import { TransactionModule } from "src/endpoints/transactions/transaction.module";
import { SmartContractResultQueryResolver } from "./smart.contract.result.query.resolver";
import { SmartContractResultModule as InternalSmartContractResultModule } from "src/endpoints/sc-results/scresult.module";

@Module({
  imports: [TransactionModule, InternalSmartContractResultModule],
  providers: [SmartContractResultLoader, SmartContractResultResolver, SmartContractResultQueryResolver],
})
export class SmartContractResultModule { }
