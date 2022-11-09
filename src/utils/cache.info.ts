import { Constants } from "@elrondnetwork/erdnest";
import moment from "moment";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";

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

  static NumShards: CacheInfo = {
    key: 'numShards',
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

  static Keybases: CacheInfo = {
    key: 'keybases',
    ttl: Constants.oneHour(),
  };

  static KeybaseConfirmation(keybase: string): CacheInfo {
    return {
      key: `keybase:${keybase}`,
      ttl: Constants.oneMonth() * 6,
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

  static IdentityProfile(key: string): CacheInfo {
    return {
      key: `identityProfile:${key}`,
      ttl: Constants.oneMonth() * 6,
    };
  }

  static CurrentPrice: CacheInfo = {
    key: 'currentPrice',
    ttl: Constants.oneHour(),
  };

  static Economics: CacheInfo = {
    key: 'economics',
    ttl: Constants.oneMinute() * 10,
  };

  static Top25Accounts: CacheInfo = {
    key: 'accounts:0:25',
    ttl: Constants.oneMinute() * 2,
  };

  static ShardAndEpochBlses(shard: any, epoch: any): CacheInfo {
    return {
      key: `${shard}_${epoch}`,
      ttl: Constants.oneWeek(),
    };
  }

  static OwnerByEpochAndBls(bls: string, epoch: number): CacheInfo {
    return {
      key: `owner:${epoch}:${bls}`,
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

  static TokenTransferProperties(identifier: string): CacheInfo {
    return {
      key: `token:transfer:properties:v2:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static EsdtProperties(identifier: string): CacheInfo {
    return {
      key: `esdt:${identifier}`,
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
      ttl: Constants.oneDay(),
    };
  }

  static EsdtPrice(identifier: string, date: string): CacheInfo {
    const isCurrentDate = moment().format('YYYY-MM-DD') === date;
    return {
      key: `esdt:price:${identifier}:${date}`,
      ttl: isCurrentDate ? Constants.oneSecond() * 12 : Constants.oneDay(),
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
      key: `tokenTransactions:${identifier}`,
      ttl: Constants.oneMinute() * 10,
    };
  }

  static TokenAccounts(identifier: string): CacheInfo {
    return {
      key: `tokenAccounts:${identifier}`,
      ttl: Constants.oneMinute() * 10,
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

  static MexTokens: CacheInfo = {
    key: "mexTokens",
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
    key: "extendedAttributesActivationNonce",
    ttl: Constants.oneDay(),
  };

  static InitEpoch: CacheInfo = {
    key: "initEpoch",
    ttl: Constants.oneDay(),
  };

  static LockedTokenID: CacheInfo = {
    key: "lockedTokenID",
    ttl: Constants.oneHour(),
  };

  static CurrentEpoch: CacheInfo = {
    key: "currentEpoch",
    ttl: Constants.oneMinute(),
  };

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
      ttl: Constants.oneWeek(),
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
}
