import { TxPool } from "./tx.pool";

export class TxPoolGatewayResponse {
  constructor(init?: Partial<TxPoolGatewayResponse>) {
    Object.assign(this, init);
  }

  txPool: TxPool = new TxPool();
}
