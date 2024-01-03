export class TxInPoolFields {
  constructor(init?: Partial<TxInPoolFields>) {
    Object.assign(this, init);
  }

  data: string = '';
  gaslimit: number = 0;
  gasprice: number = 0;
  hash: string = '';
  nonce: number = 0;
  receiver: string = '';
  receiverusername: string = '';
  sender: string = '';
  value: string = '';
}

export class TxInPoolResponse {
  constructor(init?: Partial<TxInPoolResponse>) {
    Object.assign(this, init);
  }

  txFields: TxInPoolFields = new TxInPoolFields();
}

export class TxPool {
  constructor(init?: Partial<TxPool>) {
    Object.assign(this, init);
  }

  regularTransactions: TxInPoolResponse[] = [];
  smartContractResults: TxInPoolResponse[] = [];
  rewards: TxInPoolResponse[] = [];
}

export class TxPoolGatewayResponse {
  constructor(init?: Partial<TxPoolGatewayResponse>) {
    Object.assign(this, init);
  }

  txPool: TxPool = new TxPool();
}
