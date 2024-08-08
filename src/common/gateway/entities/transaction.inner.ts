export class TransactionInner {
  constructor(init?: Partial<TransactionInner>) {
    Object.assign(this, init);
  }

  nonce: number = 0;
  value: string = '';
  receiver: string = '';
  sender: string = '';
  gasPrice: number = 0;
  gasLimit: number = 0;
  data: string = '';
  signature: string = '';
  chainId: number = 0;
  version: number = 0;
  relayer: string = '';
}
