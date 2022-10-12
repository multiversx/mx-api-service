import { Parent, ResolveField, Resolver } from "@nestjs/graphql";

import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { SmartContractResultLoader } from "src/graphql/entities/smart.contract.result/smart.contract.result.loader";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
@Resolver(() => SmartContractResult)
export class SmartContractResultResolver {
  constructor(private readonly smartContractResultLoader: SmartContractResultLoader) { }

  @ResolveField("logs", () => TransactionLog, { name: "logs", description: "Transaction logs for the given smart contract result.", nullable: true })
  public async getSmartContractResultLog(@Parent() smartContractResult: SmartContractResult) {
    return await this.smartContractResultLoader.getLog(smartContractResult.hash);
  }
}
