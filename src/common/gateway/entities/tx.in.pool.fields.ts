export class TxInPoolFields {
  constructor(init?: Partial<TxInPoolFields>) {
    Object.assign(this, init);
  }

  data: string = '';
  gaslimit: number = 0;
  gasprice: number = 0;
  guardian: string = '';
  guardiansignature: string = '';
  hash: string = '';
  nonce: number = 0;
  receiver: string = '';
  receivershard: number = 0;
  receiverusername: string | null = '';
  sender: string = '';
  sendershard: number = 0;
  signature: string = '';
  value: string = '';
}
