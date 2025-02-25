export class MexSettings {
  constructor(init?: Partial<MexSettings>) {
    Object.assign(this, init);
  }

  pairContracts: string[] = [];
  farmContracts: string[] = [];
  wrapContracts: string[] = [];
  routerFactoryContract: string = '';
  distributionContract: string = '';
  lockedAssetContract: string = '';
  lockedAssetIdentifier: string = '';
  lockedAssetIdentifierV2: string = '';
  mexId: string = '';
  wegldId: string = '';

  static fromQueryResponse(response: any): MexSettings {
    const settings = new MexSettings();
    settings.farmContracts = [
      ...response.farms.filter((x: any) => ['Active', 'Migrate'].includes(x.state)).map((x: any) => x.address),
      ...response.stakingFarms.filter((x: any) => x.state === 'Active').map((x: any) => x.address),
      ...response.stakingProxies.map((x: any) => x.address),
      ...response.proxy.map((x: any) => x.address),
    ];
    settings.pairContracts = [
      ...response.pairs.map((x: any) => x.address),
      ...response.proxy.map((x: any) => x.address),
    ];
    settings.wrapContracts = response.wrappingInfo.map((x: any) => x.address);
    settings.distributionContract = response.distribution.address;
    settings.lockedAssetContract = response.lockedAssetFactory.address;
    settings.routerFactoryContract = response.factory.address;

    const lockedAssetIdentifiers = response.proxy
      .map((proxy: any) => proxy.lockedAssetTokens.map((token: any) => token.collection))
      .flat()
      .distinct();

    settings.lockedAssetIdentifier = lockedAssetIdentifiers.find((identifier: string) => identifier.startsWith('LKMEX'));
    settings.lockedAssetIdentifierV2 = lockedAssetIdentifiers.find((identifier: string) => identifier.startsWith('XMEX'));

    const wrappedToken = response.wrappingInfo[0].wrappedToken.identifier;
    const mexToken = response.simpleLockEnergy.baseAssetToken.identifier;

    settings.wegldId = wrappedToken;
    settings.mexId = mexToken;

    return settings;
  }
}
