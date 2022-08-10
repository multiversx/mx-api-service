export class NftQueryOptions {
  constructor(init?: Partial<NftQueryOptions>) {
    Object.assign(this, init);
  }

  withOwner?: boolean = false;
  withSupply?: boolean = false;
  private _withScamInfo?: boolean = false;

  get withScamInfo(): boolean | undefined {
    return this._withScamInfo;
  }

  set withScamInfo(value: boolean | undefined) {
    this._withScamInfo = value;
  }
}
