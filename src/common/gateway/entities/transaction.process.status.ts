export class TransactionProcessStatus {
  constructor(init?: Partial<TransactionProcessStatus>) {
    Object.assign(this, init);
  }

  status: string = '';
}
