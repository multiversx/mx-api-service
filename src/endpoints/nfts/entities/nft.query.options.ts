export class NftQueryOptions {
  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean = false;
  withSupply?: boolean = false;
  withScamInfo?: boolean = false;
}
