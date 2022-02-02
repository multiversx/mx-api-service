import { Injectable } from "@nestjs/common";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { LocalCacheValue } from "./entities/local.cache.value";

@Injectable()
export class LocalCacheService {
  private static readonly dictionary: { [key: string]: LocalCacheValue } = {};

  private static lastPruneTime: number = new Date().getTime();

  setCacheValue<T>(key: string, value: T, ttl: number): T {
    if (this.needsPrune()) {
      this.prune();
    }

    const expires = new Date().getTime() + (ttl * 1000);

    LocalCacheService.dictionary[key] = {
      value,
      expires,
    };

    return value;
  }

  getCacheValue<T>(key: string): T | undefined {
    const cacheValue = LocalCacheService.dictionary[key];
    if (!cacheValue) {
      return undefined;
    }

    const now = new Date().getTime();
    if (cacheValue.expires < now) {
      delete LocalCacheService.dictionary[key];
      return undefined;
    }

    return cacheValue.value;
  }

  deleteCacheKey(key: string) {
    delete LocalCacheService.dictionary[key];
  }

  needsPrune() {
    return new Date().getTime() > LocalCacheService.lastPruneTime + 60000;
  }

  prune() {
    const now = new Date().getTime();
    LocalCacheService.lastPruneTime = now;

    const profiler = new PerformanceProfiler();

    const keys = Object.keys(LocalCacheService.dictionary);

    for (const key of keys) {
      const value = LocalCacheService.dictionary[key];
      if (value.expires < now) {
        delete LocalCacheService.dictionary[key];
      }
    }

    const keysAfter = Object.keys(LocalCacheService.dictionary);

    profiler.stop(`Local cache prune. Deleted ${keys.length - keysAfter.length} keys. Total keys in cache: ${keysAfter.length}`, true);
  }
}
