export class TransactionQueryOptions {
  private static readonly SIZE_LIMIT: number = 50;

  constructor(init?: Partial<TransactionQueryOptions>) {
    Object.assign(this, init);
  }

  withScResults?: boolean = false;
  withOperations?: boolean = true;
  withLogs?: boolean = true;
  withScResultLogs?: boolean = true;
  withScamInfo?: boolean;

  //TODO: Remove this function when enforce is no longer needed
  static enforceScamInfoFlag(size: number, options: TransactionQueryOptions): TransactionQueryOptions {
    if (size <= TransactionQueryOptions.SIZE_LIMIT) {
      options.withScamInfo = true;
    }

    return options;
  }
}
