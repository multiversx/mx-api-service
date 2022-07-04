export class StakeInfo {
  constructor(init?: Partial<StakeInfo>) {
    Object.assign(this, init);
  }

  score?: number;
  validators?: number;
  stake?: string;
  topUp?: string;
  locked: string = '0';
  distribution?: { [key: string]: number };
  providers?: any[];
  stakePercent?: number;
  sort?: number;
}
