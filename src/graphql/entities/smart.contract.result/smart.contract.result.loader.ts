import { Injectable, Scope } from "@nestjs/common";

import DataLoader from "dataloader";

import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Injectable({
  scope: Scope.REQUEST,
})
export class SmartContractResultLoader {
  constructor(private readonly transactionService: TransactionService) {}

  public async getLog(hash: string): Promise<Array<TransactionLog | null>> {
    return await this.logDataLoader.load(hash);
  }

  private readonly logDataLoader: any = new DataLoader(async hashes => {
    // @ts-ignore
    return await this.transactionService.getLogs(hashes);
  });
}
