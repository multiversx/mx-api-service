import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ElasticQuery, ElasticService } from "@multiversx/sdk-nestjs-elastic";

export class EsCircuitBreakerProxy {
  private readonly TIMEOUT_MS = 1000; // 1 second timeout
  private readonly FAILURE_THRESHOLD = 5; // Number of failures before circuit opens
  private readonly RESET_TIMEOUT_MS = 30000; // 30 seconds before attempting to reset
  private failureCount = 0;
  private lastFailureTime = 0;
  private isCircuitOpen = false;
  private readonly logger = new OriginLogger(EsCircuitBreakerProxy.name);

  constructor(
    private readonly elasticService: ElasticService,
  ) { }

  private async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isCircuitOpen) {
      const now = Date.now();
      if (now - this.lastFailureTime < this.RESET_TIMEOUT_MS) {
        this.logger.log('Circuit is open, rejecting request');
        throw new Error('Circuit breaker is open');
      }
      this.logger.log('Circuit is half-open, attempting reset');
      this.isCircuitOpen = false;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), this.TIMEOUT_MS);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.FAILURE_THRESHOLD) {
        this.isCircuitOpen = true;
        this.logger.log('Circuit breaker opened due to multiple failures');
      }

      throw error;
    }
  }

  // eslint-disable-next-line require-await
  async getCount(index: string, query: ElasticQuery): Promise<number> {
    return this.withCircuitBreaker(() => this.elasticService.getCount(index, query));
  }

  // eslint-disable-next-line require-await
  async getList(index: string, id: string, query: ElasticQuery): Promise<any[]> {
    return this.withCircuitBreaker(() => this.elasticService.getList(index, id, query));
  }

  // eslint-disable-next-line require-await
  async getItem(index: string, id: string, value: string): Promise<any> {
    return this.withCircuitBreaker(() => this.elasticService.getItem(index, id, value));
  }

  // eslint-disable-next-line require-await
  async getCustomValue(index: string, id: string, key: string): Promise<any> {
    return this.withCircuitBreaker(() => this.elasticService.getCustomValue(index, id, key));
  }

  // eslint-disable-next-line require-await
  async setCustomValue(index: string, id: string, key: string, value: any): Promise<void> {
    return this.withCircuitBreaker(() => this.elasticService.setCustomValue(index, id, key, value));
  }

  // eslint-disable-next-line require-await
  async setCustomValues(index: string, id: string, values: Record<string, any>): Promise<void> {
    return this.withCircuitBreaker(() => this.elasticService.setCustomValues(index, id, values));
  }

  // eslint-disable-next-line require-await
  async getScrollableList(index: string, id: string, query: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void> {
    return this.withCircuitBreaker(() => this.elasticService.getScrollableList(index, id, query, action));
  }

  // eslint-disable-next-line require-await
  async get(url: string): Promise<any> {
    return this.withCircuitBreaker(() => this.elasticService.get(url));
  }

  // eslint-disable-next-line require-await
  async post(url: string, data: any): Promise<any> {
    return this.withCircuitBreaker(() => this.elasticService.post(url, data));
  }
}
