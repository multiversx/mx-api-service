
export class NftQueryOptions {
  private static readonly SIZE_LIMIT: number = 100;

  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean = false;
  withSupply?: boolean = false;
  withScamInfo?: boolean = false;
  computeScamInfo?: boolean = false;

  //TODO: Remove this function when enforce is no longer needed
  static enforceScamInfoFlag(size: number, options: NftQueryOptions): NftQueryOptions {
    if (size <= NftQueryOptions.SIZE_LIMIT) {
      options.withScamInfo = true;
      options.computeScamInfo = true;
    }

    return options;
  }
}
