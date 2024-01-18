import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

export class PoolFilter {
  constructor(init?: Partial<PoolFilter>) {
    Object.assign(this, init);
  }

  sender?: string;
  receiver?: string;
  type?: TransactionType;
}
