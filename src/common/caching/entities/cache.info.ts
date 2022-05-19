import { Constants } from "src/utils/constants";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

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

  static MexTokensIndexed: CacheInfo = {
    key: "mexTokensIndexed",
    ttl: Constants.oneMinute() * 10,
  };

  static MexPrices: CacheInfo = {
    key: "mexPrices",
    ttl: Constants.oneMinute() * 10,
  };
}
