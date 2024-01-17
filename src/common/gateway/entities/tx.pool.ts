import { TxInPoolResponse } from "./tx.in.pool.response";

export class TxPool {
  constructor(init?: Partial<TxPool>) {
    Object.assign(this, init);
  }

  regularTransactions: TxInPoolResponse[] = [];
  smartContractResults: TxInPoolResponse[] = [];
  rewards: TxInPoolResponse[] = [];
}
