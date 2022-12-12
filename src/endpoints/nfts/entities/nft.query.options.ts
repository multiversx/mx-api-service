
export class NftQueryOptions {
  private static readonly SIZE_LIMIT: number = 100;

  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean;
  withSupply?: boolean;
  withScamInfo?: boolean;
  computeScamInfo?: boolean;

  //TODO: Remove this function when enforce is no longer needed
  static enforceScamInfoFlag(size: number, options: NftQueryOptions): NftQueryOptions {
    if (size <= NftQueryOptions.SIZE_LIMIT) {
      if (options.withScamInfo === undefined && options.computeScamInfo === undefined) {
        options.withScamInfo = true;
        options.computeScamInfo = true;
      }
    }

    return options;
  }
}
