import { ApiProperty } from "@nestjs/swagger";

export class FeatureConfigs {
  constructor(init?: Partial<FeatureConfigs>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Events notifier flag activation value' })
  eventsNotifier: boolean = false;

  @ApiProperty({ description: 'Guest caching flag activation value' })
  guestCaching: boolean = false;

  @ApiProperty({ description: 'Transaction pool flag activation value' })
  transactionPool: boolean = false;

  @ApiProperty({ description: 'Transaction pool warmer flag activation value' })
  transactionPoolWarmer: boolean = false;

  @ApiProperty({ description: 'Update Collection extra details flag activation value' })
  updateCollectionExtraDetails: boolean = false;

  @ApiProperty({ description: 'Accounts extra details update flag activation value' })
  updateAccountsExtraDetails: boolean = false;

  @ApiProperty({ description: 'Marketplace flag activation value' })
  marketplace: boolean = false;

  @ApiProperty({ description: 'Exchange flag activation value' })
  exchange: boolean = false;

  @ApiProperty({ description: 'Data API flag activation value' })
  dataApi: boolean = false;

  @ApiProperty({ description: 'Authentication flag activation value' })
  auth: boolean = false;

  @ApiProperty({ description: 'Staking V4 flag activation value' })
  stakingV4: boolean = false;

  @ApiProperty({ description: 'Chain Andromeda flag activation value' })
  chainAndromeda: boolean = false;

  @ApiProperty({ description: 'Node epochs left flag activation value' })
  nodeEpochsLeft: boolean = false;

  @ApiProperty({ description: 'Transaction processor flag activation value' })
  transactionProcessor: boolean = false;

  @ApiProperty({ description: 'Transaction completed flag activation value' })
  transactionCompleted: boolean = false;

  @ApiProperty({ description: 'Transaction batch flag activation value' })
  transactionBatch: boolean = false;

  @ApiProperty({ description: 'Deep history flag activation value' })
  deepHistory: boolean = false;

  @ApiProperty({ description: 'Elastic circuit breaker flag activation value' })
  elasticCircuitBreaker: boolean = false;

  @ApiProperty({ description: 'Status checker flag activation value' })
  statusChecker: boolean = false;

  @ApiProperty({ description: 'NFT scam info flag activation value' })
  nftScamInfo: boolean = false;

  @ApiProperty({ description: 'NFT processing flag activation value' })
  processNfts: boolean = false;

  @ApiProperty({ description: 'TPS flag activation value' })
  tps: boolean = false;

  @ApiProperty({ description: 'Nodes fetch flag activation value' })
  nodesFetch: boolean = false;

  @ApiProperty({ description: 'Tokens fetch flag activation value' })
  tokensFetch: boolean = false;

  @ApiProperty({ description: 'Providers fetch flag activation value' })
  providersFetch: boolean = false;

  @ApiProperty({ description: 'Assets fetch flag activation value' })
  assetsFetch: boolean = false;

  @ApiProperty({ description: 'Media redirect flag activation value' })
  mediaRedirect: boolean = false;
}
