export class StatsCounts {
  constructor(init?: Partial<StatsCounts>) {
    Object.assign(this, init);
  }

  blocks: number = 0;
  accounts: number = 0;
  transactions: number = 0;
  scResults: number = 0;
}
