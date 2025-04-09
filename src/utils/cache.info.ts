import { Constants } from "@multiversx/sdk-nestjs-common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { TpsInterval } from "src/endpoints/tps/entities/tps.interval";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static About: CacheInfo = {
    key: 'about',
    ttl: Constants.oneMinute() * 10,
  };

  static LastProcessedTimestamp: CacheInfo = {
    key: 'lastProcessedTimestamp',
    ttl: Constants.oneWeek() * 2,
  };

  static TokenMarketCap: CacheInfo = {
    key: 'tokenMarketCap',
    ttl: Constants.oneMinute() * 10,
  };

  static Nodes: CacheInfo = {
    key: 'nodes',
    ttl: Constants.oneHour(),
  };

  static ShardIds: CacheInfo = {
    key: 'shardIds',
    ttl: Constants.oneWeek(),
  };

  static ShardCount: CacheInfo = {
    key: 'shardCount',
    ttl: Constants.oneWeek(),
  };

  static GenesisTimestamp: CacheInfo = {
    key: 'genesisTimestamp',
    ttl: Constants.oneWeek(),
  };

  static ActiveShards: CacheInfo = {
    key: 'shards',
    ttl: Constants.oneMinute(),
  };

  static AllEsdtTokens: CacheInfo = {
    key: 'allEsdtTokens',
    ttl: Constants.oneHour(),
  };

  static TransactionPool: CacheInfo = {
    key: 'txpool',
    ttl: Constants.oneSecond() * 6,
  };

  static ApplicationMostUsed: CacheInfo = {
    key: 'applicationMostUsed',
    ttl: Constants.oneHour(),
  };

  static Identities: CacheInfo = {
    key: 'identities',
    ttl: Constants.oneMinute() * 15,
  };

  static Providers: CacheInfo = {
    key: 'providers',
    ttl: Constants.oneHour(),
  };

  static ProvidersWithStakeInformation: CacheInfo = {
    key: 'providersWithStakeInformation',
    ttl: Constants.oneHour(),
  };

  static ConfirmedIdentity(bls: string): CacheInfo {
    return {
      key: `confirmedIdentity:${bls}`,
      ttl: Constants.oneHour() * 6,
    };
  }

  static ConfirmedProvider(address: string): CacheInfo {
    return {
      key: `confirmedProvider:${address}`,
      ttl: Constants.oneHour() * 6,
    };
  }

  static ProviderOwner(address: string): CacheInfo {
    return {
      key: `providerOwner:${address}`,
      ttl: Constants.oneHour() * 6,
    };
  }

  static TxCount(address: string): CacheInfo {
    return {
      key: `txCount:${address}`,
      ttl: Constants.oneSecond() * 30,
    };
  }

  static IdentityProfilesKeybases: CacheInfo = {
    key: 'identityProfilesKeybases',
    ttl: Constants.oneHour(),
  };

  static CurrentPrice: CacheInfo = {
    key: 'currentPrice',
    ttl: Constants.oneHour(),
  };

  static Economics: CacheInfo = {
    key: 'economics',
    ttl: Constants.oneMinute() * 10,
  };

  static ShardAndEpochBlses(shard: any, epoch: any): CacheInfo {
    return {
      key: `${shard}_${epoch}`,
      ttl: Constants.oneWeek(),
    };
  }

  static OwnerByEpochAndBls(epoch: number, bls: string): CacheInfo {
    return {
      key: `nodeOwner:${epoch}:${bls}`,
      ttl: Constants.oneDay(),
    };
  }

  static TransactionProcessorShardNonce(shard: number): CacheInfo {
    return {
      key: `shardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    };
  }

  static TransactionCompletedShardNonce(shard: number): CacheInfo {
    return {
      key: `completedShardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    };
  }

  static TransactionBatchShardNonce(shard: number): CacheInfo {
    return {
      key: `batchShardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    };
  }

  static TokenHourChart(tokenIdentifier: string): CacheInfo {
    return {
      key: `tokenHourChart:${tokenIdentifier}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static TokenDailyChart(tokenIdentifier: string): CacheInfo {
    return {
      key: `tokenDailyChart:${tokenIdentifier}`,
      ttl: Constants.oneDay(),
    };
  }

  static TokenAssets: CacheInfo = {
    key: 'tokenAssets',
    ttl: Constants.oneDay(),
  };

  static CollectionRanks: CacheInfo = {
    key: 'collectionRanks',
    ttl: Constants.oneDay(),
  };

  static AccountAssets: CacheInfo = {
    key: 'accountLabels',
    ttl: Constants.oneDay(),
  };

  static MexSettings: CacheInfo = {
    key: 'mex:settings',
    ttl: Constants.oneHour(),
  };

  static MexContracts: CacheInfo = {
    key: 'mex:contracts',
    ttl: Constants.oneHour(),
  };

  static VerifiedAccounts: CacheInfo = {
    key: "verifiedAccounts",
    ttl: Constants.oneMinute() * 10,
  };

  static TokenTransferProperties(identifier: string): CacheInfo {
    return {
      key: `token:transfer:properties:v2:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static EsdtProperties(identifier: string): CacheInfo {
    return {
      key: `esdt:v2:${identifier}`,
      ttl: Constants.oneDay(),
    };
  }

  static CollectionProperties(identifier: string): CacheInfo {
    return {
      key: `collection:${identifier}`,
      ttl: Constants.oneDay(),
    };
  }

  static EsdtAddressesRoles(identifier: string): CacheInfo {
    return {
      key: `esdt:roles:${identifier}`,
      ttl: Constants.oneDay(),
    };
  }

  static EsdtAssets(identifier: string): CacheInfo {
    return {
      key: `esdt:assets:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static HistoricalPrice(identifier: string, date: Date): CacheInfo {
    const isCurrentDate = date.toISODateString() === new Date().toISODateString();
    const ttl = isCurrentDate ? Constants.oneMinute() * 5 : Constants.oneWeek();

    return {
      key: `historical-price:${identifier}:${date.toISODateString()}`,
      ttl,
    };
  }

  static NftMetadata(identifier: string): CacheInfo {
    return {
      key: `nftMetadata:${identifier}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static NftMedia(identifier: string): CacheInfo {
    return {
      key: `nftMedia:${identifier}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static NftMediaProperties(uri: string): CacheInfo {
    return {
      key: `nftMediaProperties:${uri}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenLockedAccounts(identifier: string): CacheInfo {
    return {
      key: `tokenLockedAccounts:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenSupply(identifier: string): CacheInfo {
    return {
      key: `tokenSupply:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenTransactions(identifier: string): CacheInfo {
    return {
      key: `tokenTransactionsv2:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenTransfers(identifier: string): CacheInfo {
    return {
      key: `tokenTransfersv2:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenAccounts(identifier: string): CacheInfo {
    return {
      key: `tokenAccountsv2:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenAccountsExtra(identifier: string): CacheInfo {
    return {
      key: `tokenAccountsExtra:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static TransactionPendingResults(hash: string): CacheInfo {
    return {
      key: `transaction:pendingresults:${hash}`,
      ttl: Constants.oneMinute() * 20,
    };
  }

  static StakeTopup(address: string): CacheInfo {
    return {
      key: `stakeTopup:${address}`,
      ttl: Constants.oneMinute() * 15,
    };
  }

  static CollectionType(collectionIdentifier: string): CacheInfo {
    return {
      key: `collectionType:${collectionIdentifier}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static MexEconomics: CacheInfo = {
    key: "mexEconomics",
    ttl: Constants.oneMinute() * 10,
  };

  static MexPairs: CacheInfo = {
    key: "mexPairs",
    ttl: Constants.oneMinute() * 10,
  };

  static MexPairsWithFarms: CacheInfo = {
    key: 'mexPairsWithFarms',
    ttl: Constants.oneMinute() * 10,
  };

  static MexTokens: CacheInfo = {
    key: "mexTokens",
    ttl: Constants.oneMinute() * 10,
  };

  static MexTokenTypes: CacheInfo = {
    key: "mexTokenTypes",
    ttl: Constants.oneMinute() * 10,
  };

  static MexFarms: CacheInfo = {
    key: "mexFarms",
    ttl: Constants.oneMinute() * 10,
  };

  static StakingProxies: CacheInfo = {
    key: "mexStakingProxies",
    ttl: Constants.oneMinute() * 10,
  };

  static MexTokensIndexed: CacheInfo = {
    key: "mexTokensIndexed",
    ttl: Constants.oneMinute() * 10,
  };

  static MexPrices: CacheInfo = {
    key: "mexPrices",
    ttl: Constants.oneMinute() * 10,
  };

  static GenerateThumbnails(identifier: string): CacheInfo {
    return {
      key: `generateThumbnails:${identifier}`,
      ttl: Constants.oneHour() * 24,
    };
  }

  static CollectionNonScOwner(collection: string): CacheInfo {
    return {
      key: `collectionNonScOwner:${collection}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static DelegationLegacy: CacheInfo = {
    key: "delegationLegacy",
    ttl: Constants.oneMinute() * 10,
  };

  static ExtendedAttributesActivationNonce: CacheInfo = {
    key: "extendedAttributesActivationNonce2",
    ttl: Constants.oneHour(),
  };

  static InitEpoch: CacheInfo = {
    key: "initEpoch",
    ttl: Constants.oneDay(),
  };

  static LockedTokenIDs: CacheInfo = {
    key: "lockedTokenIDs",
    ttl: Constants.oneHour(),
  };

  static CurrentEpoch: CacheInfo = {
    key: "currentEpoch",
    ttl: Constants.oneMinute(),
  };

  static TransactionBatch(sender: string, batchId: string): CacheInfo {
    return {
      key: `transactionbatch:${sender}:${batchId}`,
      ttl: Constants.oneMinute() * 20,
    };
  }

  static PendingTransaction(hash: string): CacheInfo {
    return {
      key: `pendingtransaction:${hash}`,
      ttl: Constants.oneMinute() * 15,
    };
  }

  static AccountsCount: CacheInfo = {
    key: "account:count",
    ttl: Constants.oneMinute(),
  };

  static AccountUsername(address: string): CacheInfo {
    return {
      key: `account:${address}:username`,
      ttl: Constants.oneWeek(),
    };
  }

  static AccountDeployedAt(address: string): CacheInfo {
    return {
      key: `accountDeployedAt:${address}`,
      ttl: Constants.oneDay(),
    };
  }

  static AccountDeployTxHash(address: string): CacheInfo {
    return {
      key: `accountDeployTxHash:${address}`,
      ttl: Constants.oneDay(),
    };
  }

  static AccountIsVerified(address: string): CacheInfo {
    return {
      key: `accountIsVerified:${address}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static Accounts(queryPagination: QueryPagination): CacheInfo {
    return {
      key: `accounts:${queryPagination.from}:${queryPagination.size}`,
      ttl: Constants.oneMinute(),
    };
  }

  static BlocksCount(filter: BlockFilter): CacheInfo {
    return {
      key: `blocks:count:${JSON.stringify(filter)}`,
      ttl: Constants.oneMinute(),
    };
  }

  static BlocksLatest(ttl?: number): CacheInfo {
    const cachingTtl = CacheInfo.computeBlocksLatestTtl(ttl);

    return {
      key: `blocks:latest:${cachingTtl}`,
      ttl: cachingTtl,
    };
  }

  private static computeBlocksLatestTtl(ttl?: number): number {
    if (ttl === undefined || ttl <= Constants.oneMinute() * 5) {
      return Constants.oneSecond() * 12;
    }

    if (ttl <= Constants.oneHour()) {
      return Constants.oneMinute() * 5;
    }

    if (ttl <= Constants.oneHour() * 6) {
      return Constants.oneMinute() * 15;
    }

    if (ttl <= Constants.oneDay()) {
      return Constants.oneMinute() * 30;
    }

    return Constants.oneHour(); // more than 1 day
  }

  static Delegation: CacheInfo = {
    key: "delegation",
    ttl: Constants.oneMinute() * 10,
  };

  static Constants: CacheInfo = {
    key: 'constants',
    ttl: Constants.oneDay(),
  };

  static NftOwnersCount(identifier: string): CacheInfo {
    return {
      key: `nftOwnerCount:${identifier}`,
      ttl: Constants.oneMinute(),
    };
  }

  static NftTags(pagination: QueryPagination): CacheInfo {
    return {
      key: `nftTags:${pagination.from}:${pagination.size}`,
      ttl: Constants.oneHour(),
    };
  }

  static NftTagCount: CacheInfo = {
    key: 'nftTagsCount',
    ttl: Constants.oneHour(),
  };

  static NodeVersions: CacheInfo = {
    key: 'nodeVersions',
    ttl: Constants.oneMinute(),
  };

  static DelegationProviders: CacheInfo = {
    key: 'delegationProviders',
    ttl: Constants.oneMinute(),
  };

  static DelegationProvider(address: string): CacheInfo {
    return {
      key: `delegationProvider:${address}`,
      ttl: Constants.oneMinute(),
    };
  }

  static GlobalStake: CacheInfo = {
    key: 'stake',
    ttl: Constants.oneMinute() * 10,
  };

  static FullWaitingList: CacheInfo = {
    key: 'waiting-list',
    ttl: Constants.oneMinute() * 5,
  };

  static PendingUploadAsset(identifier: string): CacheInfo {
    return {
      key: `pendingUploadAsset:${identifier}`,
      ttl: Constants.oneHour() * 12,
    };
  }

  static PendingMediaGet(identifier: string): CacheInfo {
    return {
      key: `pendingMediaGet:${identifier}`,
      ttl: Constants.oneHour() * 12,
    };
  }

  static PendingMetadataGet(identifier: string): CacheInfo {
    return {
      key: `pendingMetadataGet:${identifier}`,
      ttl: Constants.oneHour() * 12,
    };
  }

  static PendingGenerateThumbnail(identifier: string): CacheInfo {
    return {
      key: `pendingGenerateThumbnail:${identifier}`,
      ttl: Constants.oneHour() * 12,
    };
  }

  static Username(address: string): CacheInfo {
    return {
      key: `username:${address}`,
      ttl: Constants.oneHour(),
    };
  }

  static ContractUpgrades(address: string): CacheInfo {
    return {
      key: `contractUpgrades:${address}`,
      ttl: Constants.oneHour(),
    };
  }

  static Setting(name: string): CacheInfo {
    return {
      key: `api:settings:${name}`,
      ttl: Constants.oneHour(),
    };
  }

  static DataApiTokens: CacheInfo = {
    key: 'data-api:tokens',
    ttl: Constants.oneMinute() * 10,
  };

  static AddressEsdtTrieTimeout(address: string): CacheInfo {
    return {
      key: `addressEsdtTrieTimeout:${address}`,
      ttl: Constants.oneHour(),
    };
  }

  static GithubKeysValidated(identity: string): CacheInfo {
    return {
      key: `githubKeysValidated:${identity}`,
      ttl: Constants.oneDay(),
    };
  }

  static GithubProfileValidated(identity: string): CacheInfo {
    return {
      key: `githubProfileValidated:${identity}`,
      ttl: Constants.oneDay(),
    };
  }

  static DataApiTokenPrice(identifier: string, timestamp?: number): CacheInfo {
    const priceDate = timestamp ? new Date(timestamp * 1000) : new Date();
    const isCurrentDate = priceDate.toISODateString() === new Date().toISODateString();
    const ttl = isCurrentDate ? Constants.oneMinute() * 5 : Constants.oneWeek();

    const key = priceDate.toISODateString();
    return {
      key: `data-api:price:${identifier}:${key}`,
      ttl,
    };
  }

  static TpsNonceByShard(shardId: number): CacheInfo {
    return {
      key: `tpsCurrentNonce:${shardId}`,
      ttl: Constants.oneDay(),
    };
  }

  static TpsByTimestampAndFrequency(timestamp: number, frequency: number): CacheInfo {
    return {
      key: `tpsTransactions:${timestamp}:${frequency}`,
      ttl: frequency * 300,
    };
  }

  static TpsHistoryByInterval(interval: TpsInterval): CacheInfo {
    return {
      key: `tpsHistory:${interval}`,
      ttl: Constants.oneMinute(),
    };
  }

  static TpsMaxByInterval(interval: TpsInterval): CacheInfo {
    return {
      key: `tpsMax:${interval}`,
      ttl: Constants.oneDay(),
    };
  }

  static TransactionCountByShard(shardId: number): CacheInfo {
    return {
      key: `transactionCount:${shardId}`,
      ttl: Constants.oneHour(),
    };
  }

  static NodesAuctions: CacheInfo = {
    key: 'nodesAuctions',
    ttl: Constants.oneMinute(),
  };

  static ValidatorAuctions: CacheInfo = {
    key: 'validatorAuctions',
    ttl: Constants.oneHour(),
  };

  static Applications(queryPagination: QueryPagination): CacheInfo {
    return {
      key: `applications:${queryPagination.from}:${queryPagination.size}`,
      ttl: Constants.oneMinute(),
    };
  }

  static DeepHistoryBlock(timestamp: number, shardId: number): CacheInfo {
    return {
      key: `deepHistoryBlock:${timestamp}:${shardId}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static PpuMetadataByShard(shardId: number): CacheInfo {
    return {
      key: `ppuMetadata:shard:${shardId}`,
      ttl: Constants.oneSecond() * 30,
    };
  }
}
