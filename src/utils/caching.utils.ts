import { CachingService, OriginLogger } from "@elrondnetwork/erdnest";

export class CachingUtils {
  static async executeOptimistic<T>(param: { cachingService: CachingService, description: string, key: string, ttl: number, action: () => Promise<T> }): Promise<T | undefined> {
    const logger = new OriginLogger(CachingUtils.name);

    const cacheValue = await param.cachingService.getCacheRemote(param.key);
    if (cacheValue) {
      logger.log(`Skipped ${param.description}`);
      return undefined;
    }

    logger.log(`Started ${param.description}`);
    await param.cachingService.setCacheRemote(param.key, true, param.ttl);

    const result = await param.action();

    logger.log(`Finished ${param.description}`);
    await param.cachingService.deleteInCache(param.key);

    return result;
  }
}
