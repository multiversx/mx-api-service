export class AccountState {
  nonce!: number;
  balance!: string;
  developerReward!: string;
  address!: string;
  codeHash?: string;
  rootHash!: string;
  ownerAddress?: string;
  username?: string;
  codeMetadata?: string;

  constructor(init?: Partial<AccountState>) {
    Object.assign(this, init);
  }
}
