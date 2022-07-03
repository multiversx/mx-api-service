export class MetabondingWeek {
  constructor(init?: Partial<MetabondingWeek>) {
    Object.assign(this, init);
  }
  week: number = 0;
  egldStaked: string = '';
  lkmexStaked: string = '';
}
