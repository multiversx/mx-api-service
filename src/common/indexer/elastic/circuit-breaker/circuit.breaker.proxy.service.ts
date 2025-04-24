import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { ElasticQuery, ElasticService } from "@multiversx/sdk-nestjs-elastic";
import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ApiConfigService } from "../../../api-config/api.config.service";

@Injectable()
export class EsCircuitBreakerProxy {
  private failureCount = 0;
  private lastFailureTime = 0;
  private isCircuitOpen = false;
  private readonly logger = new OriginLogger(EsCircuitBreakerProxy.name);
  private readonly enabled: boolean;
  private readonly config: { durationThresholdMs: number, failureCountThreshold: number, resetTimeoutMs: number };

  constructor(
    readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
  ) {
    this.enabled = apiConfigService.isElasticCircuitBreakerEnabled();
    this.config = apiConfigService.getElasticCircuitBreakerConfig();
    this.logger.log(`ES Circuit Breaker. Enabled: ${this.enabled}. Duration threshold: ${this.config.durationThresholdMs}ms. 
    FailureCountThreshold: ${this.config.failureCountThreshold}ms. FailureCountThreshold: ${this.config.failureCountThreshold}`);
  }

  private async withCircuitBreaker<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return operation();
    }

    if (this.isCircuitOpen) {
      const now = Date.now();
      if (now - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.logger.log('Circuit is half-open, attempting reset');
        this.isCircuitOpen = false;
        this.failureCount = 0;
      } else {
        throw new ServiceUnavailableException();
      }
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timed out')), this.config.durationThresholdMs);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.config.failureCountThreshold) {
        if (!this.isCircuitOpen) {
          this.logger.log('Circuit breaker opened due to multiple failures');
        }

        this.isCircuitOpen = true;
      }

      throw new ServiceUnavailableException();
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
