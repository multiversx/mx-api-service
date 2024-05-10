
export class NftQueryOptions {
  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean;
  withSupply?: boolean;
}
