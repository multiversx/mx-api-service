export class StakeTopup {
  constructor(init?: Partial<StakeTopup>) {
    Object.assign(this, init);
  }

  topUp: string = '';
  stake: string = '';
  locked: string = '';
  numNodes: number = 0;
  address: string = '';
  blses: string[] = [];
}
