import { Constants } from "src/utils/constants";

export class CacheInfo {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static Nodes(): CacheInfo {
    return {
      key: 'nodes',
      ttl: Constants.oneHour()
    }
  }

  static AllEsdtTokens(): CacheInfo {
    return {
      key: 'allEsdtTokens',
      ttl: Constants.oneHour()
    }
  }

  static Identities(): CacheInfo {
    return {
      key: 'identities',
      ttl: Constants.oneMinute() * 15
    }
  }

  static Providers(): CacheInfo {
    return {
      key: 'providers',
      ttl: Constants.oneHour()
    }
  }

  static ProvidersWithStakeInformation(): CacheInfo {
    return {
      key: 'providersWithStakeInformation',
      ttl: Constants.oneHour()
    }
  }

  static Keybases(): CacheInfo {
    return {
      key: 'keybases',
      ttl: Constants.oneHour()
    }
  }

  static KeybaseConfirmation(keybase: string): CacheInfo {
    return {
      key: `keybase:${keybase}`,
      ttl:  Constants.oneMonth() * 6
    }
  }

  static IdentityProfilesKeybases(): CacheInfo {
    return {
      key: 'identityProfilesKeybases',
      ttl: Constants.oneHour()
    }
  }

  static IdentityProfile(key: string): CacheInfo {
    return {
      key: `identityProfile:${key}`,
      ttl: Constants.oneMonth() * 6
    }
  }

  static CurrentPrice(): CacheInfo {
    return {
      key: 'currentPrice',
      ttl: Constants.oneHour()
    }
  }

  static Economics(): CacheInfo {
    return {
      key: 'economics',
      ttl:  Constants.oneMinute() * 10
    }
  }

  static Top25Accounts(): CacheInfo {
    return {
      key: 'accounts:0:25',
      ttl:  Constants.oneMinute() * 2
    }
  }

  static ShardAndEpochBlses(shard: any, epoch: any): CacheInfo {
    return {
      key: `${shard}_${epoch}`,
      ttl: Constants.oneWeek(),
    }
  }

  static OwnerByEpochAndBls(bls: string, epoch: number): CacheInfo {
    return {
      key: `owner:${epoch}:${bls}`,
      ttl: Constants.oneDay(),
    }
  }

  static ShardNonce(shard: number): CacheInfo {
    return {
      key: `shardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    }
  }

  static TokenAssets(): CacheInfo {
    return {
      key: 'tokenAssets',
      ttl: Constants.oneDay(),
    }
  }
}