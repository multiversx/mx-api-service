import { Injectable } from "@nestjs/common";
import DataLoader from "dataloader";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Injectable()
export class SmartContractResultLoader {
  constructor(private readonly transactionService: TransactionService) { }

  public async getLog(hash: string): Promise<Array<TransactionLog | null>> {
    return await this.logDataLoader.load(hash);
  }

  // @ts-ignore
  private readonly logDataLoader: any = new DataLoader(async hashes => await this.transactionService.getLogs(hashes), { cache: false });
}
