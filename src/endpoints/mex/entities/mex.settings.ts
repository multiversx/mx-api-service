export class MexSettings {
  constructor(init?: Partial<MexSettings>) {
    Object.assign(this, init);
  }

  pairContracts: string[] = [];
  farmContracts: string[] = [];
  wrapContracts: string[] = [];
  distributionContract: string = '';
  lockedAssetContract: string = '';
  lockedAssetIdentifier: string = '';
  mexId: string = '';
  wegldId: string = '';
}
