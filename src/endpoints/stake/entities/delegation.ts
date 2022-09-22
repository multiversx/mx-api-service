export class Delegation {
  constructor(init?: Partial<Delegation>) {
    Object.assign(this, init);
  }

  address: string = "";
  contract: string = "";
  stake: string = "";
  userActiveStake: string = "";
  claimableRewards: string = "";
}
