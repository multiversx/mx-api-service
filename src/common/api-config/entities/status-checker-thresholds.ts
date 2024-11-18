export class StatusCheckerThresholds {
  constructor(init?: Partial<StatusCheckerThresholds>) {
    Object.assign(this, init);
  }

  public tokens: number = 0;
  public nodes: number = 0;
  public providers: number = 0;
  public tokenSupplyCount: number = 0;
  public tokenAssets: number = 0;
  public tokenAccounts: number = 0;
  public tokenTransactions: number = 0;
  public nodeValidators: number = 0;
}
