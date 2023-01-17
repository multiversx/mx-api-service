import { TransactionBatchGroup } from "./transaction.batch.group";
import { TransactionBatchStatus } from "./transaction.batch.status";

export class TransactionBatch {
  id: string = '';

  groups: TransactionBatchGroup[] = [];

  status: TransactionBatchStatus = TransactionBatchStatus.pending;

  sourceIp: string = '';

  static getAddress(batch: TransactionBatch): string {
    return batch.groups[0].items[0].transaction.tx.sender;
  }
}
