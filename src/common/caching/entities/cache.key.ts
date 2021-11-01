import { Constants } from "src/utils/constants";

export class CacheKey {
  key?: string;
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

  static IdentityProfilesKeybases(): CacheKey {
    return {
      key: 'identityProfilesKeybases',
      ttl: Constants.oneHour()
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
}