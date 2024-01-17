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
