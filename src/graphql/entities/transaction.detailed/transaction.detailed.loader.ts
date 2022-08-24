import { Injectable, Scope } from "@nestjs/common";

import DataLoader from "dataloader";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountService } from "src/endpoints/accounts/account.service";
import { SmartContractResult } from "src/endpoints/sc-results/entities/smart.contract.result";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";
import { TransactionService } from "src/endpoints/transactions/transaction.service";

@Injectable({
  scope: Scope.REQUEST,
})
export class TransactionDetailedLoader {
  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService
  ) { }

  public async getSmartContractResults(hash: string): Promise<Array<SmartContractResult[] | null>> {
    return await this.smartContractResultsDataLoader.load(hash);
  }

  public async getOperations(transaction: TransactionDetailed): Promise<Array<TransactionOperation[] | null>> {
    return await this.operationsDataLoader.load(transaction);
  }

  public async getLog(hash: string): Promise<Array<TransactionLog | null>> {
    return await this.logDataLoader.load(hash);
  }

  private readonly smartContractResultsDataLoader: any = new DataLoader(async hashes =>
    // @ts-ignore
    await this.transactionService.getSmartContractResults(hashes)
  );

  private readonly operationsDataLoader: any = new DataLoader(async transactions =>
    // @ts-ignore
    await this.transactionService.getOperations(transactions)
  );

  private readonly logDataLoader: any = new DataLoader(async hashes =>
    // @ts-ignore
    await this.transactionService.getLogs(hashes)
  );

  public async getAccount(address: string): Promise<Array<Account>> {
    return await this.accountDataLoader.load(address);
  }

  private readonly accountDataLoader: any = new DataLoader(async addresses => {
    // @ts-ignore
    const accounts = await this.accountService.getAccountsForAddresses(addresses);

    return accounts.sorted((element) => addresses.indexOf(element.address));
  });
}
