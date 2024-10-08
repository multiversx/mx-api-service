export class DelegationData {
  constructor(init?: Partial<DelegationData>) {
    Object.assign(this, init);
  }

  aprValue: number | undefined = undefined;
  featured: boolean = false;
  contract: string | null = null;
  owner: string | null = null;
  automaticActivation: boolean = false;
  initialOwnerFunds: string = "";
  checkCapOnRedelegate: boolean = false;
  totalUnStaked: string = "";
  createdNonce: number = 0;
  ownerBelowRequiredBalanceThreshold: boolean = false;
}
