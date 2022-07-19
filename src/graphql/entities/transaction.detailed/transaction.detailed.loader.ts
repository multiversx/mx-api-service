import { Injectable, Scope } from "@nestjs/common";

import DataLoader from "dataloader";

import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Injectable({
  scope: Scope.REQUEST,
})
export class TransactionDetailedLoader {
  private readonly smartContractResultsLoader: any = new DataLoader(async hashes =>
    // @ts-ignore
    await this.transactionService.getSmartContractResults(hashes)
  );

  private readonly operationsLoader: any = new DataLoader(async transactions =>
    // @ts-ignore
    await this.transactionService.getOperations(transactions)
  );

  private readonly logLoader: any = new DataLoader(async hashes =>
    await this.transactionService.getLogs(hashes)
  );

  constructor(private readonly transactionService: TransactionService) { }

  public async getSmartContractResults(transactionHash: string): Promise<Array<SmartContractResult[] | null>> {
    return await this.smartContractResultsLoader.load(transactionHash);
  }

  public async getOperations(transaction: TransactionDetailed): Promise<Array<TransactionOperation[] | null>> {
    return await this.operationsLoader.load(transaction);
  }

  public async getLog(hashes: string): Promise<Array<TransactionLog | null>> {
    return await this.logLoader.load(hashes);
  }
}
