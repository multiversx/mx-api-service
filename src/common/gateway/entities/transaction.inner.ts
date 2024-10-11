export class TransactionInner {
  constructor(init?: Partial<TransactionInner>) {
    Object.assign(this, init);
  }

  hash: string = '';
  nonce: number = 0;
  value: string = '';
  receiver: string = '';
  sender: string = '';
  gasPrice: number = 0;
  gasLimit: number = 0;
  data: string = '';
  signature: string = '';
  chainID: string = '';
  version: number = 0;
  relayer: string = '';
  options: number = 0;
  guardianSignature: string = '';
  senderUsername: string = '';
  receiverUsername: string = '';
}
