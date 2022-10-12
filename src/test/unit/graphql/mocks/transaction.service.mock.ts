import { randomInt, randomUUID } from "crypto";

import { Transaction } from "src/endpoints/transactions/entities/transaction";
import { TransactionDetailed } from "src/endpoints/transactions/entities/transaction.detailed";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionQueryOptions } from "src/endpoints/transactions/entities/transactions.query.options";
import { QueryPagination } from "src/common/entities/query.pagination";

export class TransactionServiceMock {
  private static readonly count = randomInt(25, 100);

  private static readonly generateTransaction = (): TransactionDetailed => {
    return new TransactionDetailed({
      txHash: randomUUID(),
      sender: randomUUID(),
    });
  };

  static readonly transactions: Array<TransactionDetailed> = Array.from({ length: TransactionServiceMock.count }, () => TransactionServiceMock.generateTransaction());

  public getTransactions(_: TransactionFilter, __: QueryPagination, ___?: TransactionQueryOptions, ____?: string): Array<Transaction> {
    return TransactionServiceMock.transactions;
  }

  public getTransactionCount(transactionFilter: TransactionFilter, __?: string): number {
    const length: number = TransactionServiceMock.transactions.filter(transaction => transactionFilter.hashes?.some((hash) => transaction.txHash === hash)).length;

    return length === 0 ? TransactionServiceMock.transactions.length : length;
  }

  public getTransaction(hash: string, _?: string[]): TransactionDetailed | null {
    return TransactionServiceMock.transactions.find(transaction => transaction.txHash === hash) ?? null;
  }
}
