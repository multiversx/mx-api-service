export class AccountChanges {
  nonceChanged!: boolean;
  balanceChanged!: boolean;
  codeHashChanged!: boolean;
  rootHashChanged!: boolean;
  developerRewardChanged!: boolean;
  ownerAddressChanged!: boolean;
  userNameChanged!: boolean;
  codeMetadataChanged!: boolean;

  constructor(init?: Partial<AccountChanges>) {
    Object.assign(this, init);
  }
}
