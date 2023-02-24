export class TransactionPool {
  constructor(init?: Partial<TransactionPool>) {
    Object.assign(this, init);
  }
  txHash?: string;
  sender?: string;
  receiver?: string;
  value?: number;
  nonce?: number;
  data?: string;
  gasPrice?: number;
  gasLimit?: number;
}
