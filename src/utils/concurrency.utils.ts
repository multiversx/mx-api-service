import { OriginLogger } from "@multiversx/sdk-nestjs-common";

export class ConcurrencyUtils {
  private static readonly logger = new OriginLogger(ConcurrencyUtils.name);

  static async executeWithConcurrencyLimit<T, R>(
    items: T[],
    asyncOperation: (item: T) => Promise<R>,
    concurrencyLimit: number = 10,
    description?: string
  ): Promise<R[]> {
    if (items.length === 0) {
      return [];
    }

    const logPrefix = description ? `[${description}] ` : '';
    this.logger.log(`${logPrefix}Processing ${items.length} items with concurrency limit ${concurrencyLimit}`);

    const results: R[] = [];
    const batchCount = Math.ceil(items.length / concurrencyLimit);

    for (let i = 0; i < items.length; i += concurrencyLimit) {
      const batchIndex = Math.floor(i / concurrencyLimit) + 1;
      const batch = items.slice(i, i + concurrencyLimit);

      this.logger.log(`${logPrefix}Processing batch ${batchIndex}/${batchCount} (${batch.length} items)`);

      const batchPromises = batch.map(item => asyncOperation(item));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);
    }

    this.logger.log(`${logPrefix}Completed processing ${items.length} items`);
    return results;
  }

  static async executeWithChunksAndDelay<T, R>(
    items: T[],
    asyncOperation: (item: T) => Promise<R>,
    chunkSize: number = 10,
    delayMs: number = 100,
    description?: string
  ): Promise<R[]> {
    if (items.length === 0) {
      return [];
    }

    const logPrefix = description ? `[${description}] ` : '';
    this.logger.log(`${logPrefix}Processing ${items.length} items in chunks of ${chunkSize} with ${delayMs}ms delay`);

    const results: R[] = [];
    const chunkCount = Math.ceil(items.length / chunkSize);

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunkIndex = Math.floor(i / chunkSize) + 1;
      const chunk = items.slice(i, i + chunkSize);

      this.logger.log(`${logPrefix}Processing chunk ${chunkIndex}/${chunkCount} (${chunk.length} items)`);

      const chunkPromises = chunk.map(item => asyncOperation(item));
      const chunkResults = await Promise.all(chunkPromises);

      results.push(...chunkResults);

      if (i + chunkSize < items.length && delayMs > 0) {
        await this.delay(delayMs);
      }
    }

    this.logger.log(`${logPrefix}Completed processing ${items.length} items`);
    return results;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
