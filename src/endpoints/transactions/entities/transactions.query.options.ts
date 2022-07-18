export class TransactionQueryOptions {
  constructor(init?: Partial<TransactionQueryOptions>) {
    Object.assign(this, init);
  }

  withScResults?: boolean = false;
  withOperations?: boolean = true;
  withLogs?: boolean = true;
  withScResultLogs?: boolean = true;
}
