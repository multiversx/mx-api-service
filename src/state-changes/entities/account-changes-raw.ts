export enum AccountChangesRaw {
  NoChange = 0,
  NonceChanged = 1 << 0,            // 1
  BalanceChanged = 1 << 1,          // 2
  CodeHashChanged = 1 << 2,         // 4
  RootHashChanged = 1 << 3,         // 8
  DeveloperRewardChanged = 1 << 4,  // 16
  OwnerAddressChanged = 1 << 5,     // 32
  UserNameChanged = 1 << 6,         // 64
  CodeMetadataChanged = 1 << 7      // 128
}
