import { Injectable, Scope } from "@nestjs/common";

import DataLoader from "dataloader";

import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Injectable({
  scope: Scope.REQUEST,
})
export class SmartContractResultLoader {
  private readonly logLoader: any = new DataLoader(async hashes => {
    return await this.transactionService.getLogs(hashes);
  });

  constructor(private readonly transactionService: TransactionService) {}

  public async getLog(hashes: string): Promise<Array<TransactionLog | null>> {
    return await this.logLoader.load(hashes);
  }
}
