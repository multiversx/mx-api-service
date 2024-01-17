import { TxInPoolFields } from "./tx.in.pool.fields";

export class TxInPoolResponse {
  constructor(init?: Partial<TxInPoolResponse>) {
    Object.assign(this, init);
  }

  txFields: TxInPoolFields = new TxInPoolFields();
}
