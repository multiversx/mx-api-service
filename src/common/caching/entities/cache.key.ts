import { Constants } from "src/utils/constants";

export class CacheKey {
  key: string = "";
  ttl: number = Constants.oneSecond() * 6;

  static Nodes(): CacheKey {
    return {
      key: 'nodes',
      ttl: Constants.oneHour()
    }
  }

  static AllEsdtTokens(): CacheKey {
    return {
      key: 'allEsdtTokens',
      ttl: Constants.oneHour()
    }
  }

  static Identities(): CacheKey {
    return {
      key: 'identities',
      ttl: Constants.oneMinute() * 15
    }
  }

  static Providers(): CacheKey {
    return {
      key: 'providers',
      ttl: Constants.oneHour()
    }
  }

  static ProvidersWithStakeInformation(): CacheKey {
    return {
      key: 'providersWithStakeInformation',
      ttl: Constants.oneHour()
    }
  }

  static Keybases(): CacheKey {
    return {
      key: 'keybases',
      ttl: Constants.oneHour()
    }
  }

  static KeybaseConfirmation(keybase: string): CacheKey {
    return {
      key: `keybase:${keybase}`,
      ttl:  Constants.oneMonth() * 6
    }
  }

  static IdentityProfilesKeybases(): CacheKey {
    return {
      key: 'identityProfilesKeybases',
      ttl: Constants.oneHour()
    }
  }

  static IdentityProfile(key: string): CacheKey {
    return {
      key: `identityProfile:${key}`,
      ttl: Constants.oneMonth() * 6
    }
  }

  static CurrentPrice(): CacheKey {
    return {
      key: 'currentPrice',
      ttl: Constants.oneHour()
    }
  }

  static Economics(): CacheKey {
    return {
      key: 'economics',
      ttl:  Constants.oneMinute() * 10
    }
  }

  static Top25Accounts(): CacheKey {
    return {
      key: 'accounts:0:25',
      ttl:  Constants.oneMinute() * 2
    }
  }

  static ShardAndEpochBlses(shard: any, epoch: any): CacheKey {
    return {
      key: `${shard}_${epoch}`,
      ttl: Constants.oneWeek(),
    }
  }

  static OwnerByEpochAndBls(bls: string, epoch: number): CacheKey {
    return {
      key: `owner:${epoch}:${bls}`,
      ttl: Constants.oneDay(),
    }
  }

  static ShardNonce(shard: number): CacheKey {
    return {
      key: `shardNonce:${shard}`,
      ttl: Number.MAX_SAFE_INTEGER,
    }
  }

  static TokenAssets(): CacheKey {
    return {
      key: 'tokenAssets',
      ttl: Constants.oneDay(),
    }
  }
}