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
      ...response.pairs.filter((x: any) => x.state === 'Active').map((x: any) => x.address),
      ...response.proxy.map((x: any) => x.address),
    ];
    settings.wrapContracts = response.wrappingInfo.map((x: any) => x.address);
    settings.distributionContract = response.distribution.address;
    settings.lockedAssetContract = response.lockedAssetFactory.address;

    const lockedAssetIdentifiers = response.proxy
      .map((proxy: any) => proxy.lockedAssetTokens.map((token: any) => token.collection))
      .flat()
      .distinct();

    settings.lockedAssetIdentifier = lockedAssetIdentifiers.find((identifier: string) => identifier.startsWith('LKMEX'));
    settings.lockedAssetIdentifierV2 = lockedAssetIdentifiers.find((identifier: string) => identifier.startsWith('XMEX'));

    const mexEgldPairs = response.pairs.filter((x: any) => x.firstToken.name === 'WrappedEGLD' && x.secondToken.name === 'MEX');
    if (mexEgldPairs.length > 0) {
      settings.wegldId = mexEgldPairs[0].firstToken.identifier;
      settings.mexId = mexEgldPairs[0].secondToken.identifier;
    }

    return settings;
  }
}
