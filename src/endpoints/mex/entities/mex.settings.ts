export class MexSettings {
  constructor(init?: Partial<MexSettings>) {
    Object.assign(this, init);
  }

  pairContracts: string[] = [];
  farmContracts: string[] = [];
  wrapContracts: string[] = [];
  distributionContract: string = '';
  lockedAssetContract: string = '';
  lockedAssetIdentifiers: string[] = [];
  mexId: string = '';
  wegldId: string = '';
}
