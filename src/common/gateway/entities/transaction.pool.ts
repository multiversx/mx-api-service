export class TransactionPool {
  constructor(init?: Partial<TransactionPool>) {
    Object.assign(this, init);
  }

  hash: string = '';
  sender: string = '';
  receiver: string = '';
  nonce: number = 0;
  value: number = 0;
  gasprice: number = 0;
  gaslimit: number = 0;
  data: string = '';
}
