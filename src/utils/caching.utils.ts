import { ElrondCachingService, OriginLogger } from "@multiversx/sdk-nestjs";

export class CachingUtils {
  static async executeOptimistic<T>(param: { cachingService: ElrondCachingService, description: string, key: string, ttl: number, action: () => Promise<T> }): Promise<T | undefined> {
    const logger = new OriginLogger(CachingUtils.name);

    const cacheValue = await param.cachingService.getRemote(param.key);
    if (cacheValue) {
      logger.log(`Skipped ${param.description}`);
      return undefined;
    }

    logger.log(`Started ${param.description}`);
    await param.cachingService.setRemote(param.key, true, param.ttl);

    const result = await param.action();

    logger.log(`Finished ${param.description}`);
    await param.cachingService.deleteInCache(param.key);

    return result;
  }
}
