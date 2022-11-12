export class AccountDetailed {
  constructor(init?: Partial<AccountDetailed>) {
    Object.assign(this, init);
  }

  address: string = '';
  nonce: number = 0;
  balance: string = '';
  username: string = '';
  code: string = '';
  codeHash: string | undefined;
  rootHash: string = '';
  codeMetadata: string = '';
  developerReward: string = '';
  ownerAddress: string = '';
}
