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

  static ShardNonce(shard: number): CacheInfo {
    return {
      key: `shardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    };
  }

  static TokenAssets: CacheInfo = {
    key: 'tokenAssets',
    ttl: Constants.oneDay(),
  };

  static TokenTransferProperties(identifier: string): CacheInfo {
    return {
      key: `token:transfer:properties:v2:${identifier}`,
      ttl: Constants.oneDay(),
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
      ttl: Constants.oneHour(),
    };
  }

  static NftMedia(identifier: string): CacheInfo {
    return {
      key: `nftMedia:${identifier}`,
      ttl: Constants.oneHour(),
    };
  }

  static NftMediaProperties(uri: string): CacheInfo {
    return {
      key: `nftMediaProperties:${uri}`,
      ttl: Constants.oneHour(),
    };
  }

  static TokenTransactions(identifier: string): CacheInfo {
    return {
      key: `tokenTransactions:${identifier}`,
      ttl: Constants.oneMinute(),
    };
  }

  static TokenHolders(identifier: string): CacheInfo {
    return {
      key: `tokenHolders:${identifier}`,
      ttl: Constants.oneMinute(),
    };
  }
}