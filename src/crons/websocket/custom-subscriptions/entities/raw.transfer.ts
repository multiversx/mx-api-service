import { TransactionDetailed } from 'src/endpoints/transactions/entities/transaction.detailed';

export class RawTransfer {
  constructor(init?: Partial<RawTransfer>) {
    Object.assign(this, init);
  }

  transfer: TransactionDetailed = new TransactionDetailed();
  tokens: string[] = [];
}
