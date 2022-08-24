import { randomInt, randomUUID } from "crypto";

import { Account } from "src/endpoints/accounts/entities/account";
import { AccountDetailed } from "src/endpoints/accounts/entities/account.detailed";
import { QueryPagination } from "src/common/entities/query.pagination";

export class AccountServiceMock {
  private static readonly generateAccount = (): AccountDetailed => {
    return new AccountDetailed({
      address: randomUUID(),
      balance: randomInt(3).toString(),
      nonce: randomInt(3),
      shard: randomInt(3),
    });
  };

  static readonly accounts: Array<AccountDetailed> = [
    AccountServiceMock.generateAccount(),
    AccountServiceMock.generateAccount(),
    AccountServiceMock.generateAccount(),
  ];

  public getAccounts(queryPagination: QueryPagination): Array<Account> {
    return AccountServiceMock.accounts.slice(queryPagination.from, queryPagination.size);
  }

  public getAccountsCount(): number {
    return AccountServiceMock.accounts.length;
  }

  public getAccountSimple(address: string): AccountDetailed | null {
    return AccountServiceMock.accounts.find(account => account.address === address) ?? null;
  }

  public getAccountTxCount(_: string): number {
    return 0;
  }

  public getAccountScResults(_: string): number {
    return 0;
  }
}
