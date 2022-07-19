import { Parent, ResolveField, Resolver } from "@nestjs/graphql";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";

import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionDetailedQuery } from "src/graphql/entities/transaction.detailed/transaction.detailed.query";
import { TransactionDetailedLoader } from "src/graphql/entities/transaction.detailed/transaction.detailed.loader";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Resolver(() => TransactionDetailed)
export class TransactionDetailedResolver extends TransactionDetailedQuery {
  constructor(
    private readonly transactionDetailedLoader: TransactionDetailedLoader,
    transactionService: TransactionService
  ) {
    super(transactionService);
  }

  @ResolveField("results", () => [SmartContractResult], { name: "results", description: "Smart contract results for the given detailed transaction.", nullable: true })
  public async getTransactionSmartContractResults(@Parent() transaction: TransactionDetailed) {
    return await this.transactionDetailedLoader.getSmartContractResults(transaction.txHash);
  }

  @ResolveField("operations", () => [TransactionOperation], { name: "operations", description: "Transaction operations for the given detailed transaction.", nullable: true })
  public async getTransactionOperations(@Parent() transaction: TransactionDetailed) {
    return await this.transactionDetailedLoader.getOperations(transaction);
  }

  @ResolveField("logs", () => TransactionLog, { name: "logs", description: "Transaction log for the given detailed transaction.", nullable: true })
  public async getTransactionLog(@Parent() transaction: TransactionDetailed) {
    return await this.transactionDetailedLoader.getLog(transaction.txHash);
  }
}
