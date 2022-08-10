const SIZE_LIMIT: number = 100;

export class NftQueryOptions {
  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean = false;
  withSupply?: boolean = false;
  withScamInfo?: boolean = false;

  //TODO: Remove this function
  static enforceScamInfoFlag(size: number, options: NftQueryOptions): NftQueryOptions {
    if (size < SIZE_LIMIT) {
      options.withScamInfo = true;
    }

    return options;
  }
}
