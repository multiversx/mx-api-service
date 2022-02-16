import { ShardTransaction } from "@elrondnetwork/transaction-processor";

export interface TransactionExtractorInterface<T> {
  extract(transaction: ShardTransaction): T | undefined;
}
