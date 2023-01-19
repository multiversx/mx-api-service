import { Transaction } from "./transaction";
import { BatchTransactionStatus } from "./batch.transaction.status";

export class TransactionBatchItem {
  transaction: Transaction = new Transaction();

  status: BatchTransactionStatus = BatchTransactionStatus.pending;

  error?: string;
}
