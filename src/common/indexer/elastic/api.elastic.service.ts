import { ContextTracker } from "@multiversx/sdk-nestjs-common";
import { ElasticQuery, ElasticService } from "@multiversx/sdk-nestjs-elastic";
import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";

@Injectable()
export class ApiElasticService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly apiConfigService: ApiConfigService,
  ) { }

  async getCount(collection: string, query: ElasticQuery): Promise<any> {
    return await this.call(async () => await this.elasticService.getCount(collection, query), collection);
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    return await this.call(async () => await this.elasticService.getList(collection, key, elasticQuery, overrideUrl), collection);
  }

  async getItem(collection: string, key: string, identifier: string): Promise<any> {
    return await this.call(async () => await this.elasticService.getItem(collection, key, identifier), collection);
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>, options?: { scrollTimeout?: string; delayBetweenScrolls?: number; }): Promise<void> {
    return await this.call(async () => await this.elasticService.getScrollableList(collection, key, elasticQuery, action, options), collection);
  }

  async get(url: string): Promise<any> {
    return await this.elasticService.get(url);
  }

  async post(url: string, body: any): Promise<any> {
    return await this.elasticService.post(url, body);
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    return await this.call(async () => await this.elasticService.getCustomValue(collection, identifier, attribute), collection);
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    return await this.elasticService.setCustomValue(collection, identifier, attribute, value);
  }

  async setCustomValues<T>(collection: string, identifier: string, dict: Record<string, T>): Promise<void> {
    return await this.elasticService.setCustomValues(collection, identifier, dict);
  }

  private async call(action: () => Promise<any>, collection: string): Promise<any> {
    if (this.apiConfigService.isElasticCallsTracingEnabled()) {
      const elasticCallsObj: any = { collection };

      if (this.apiConfigService.isElasticCallsTracingVerboseLoggingEnabled()) {
        elasticCallsObj.stack = new Error().stack;
      }

      const context = ContextTracker.get();

      if (context.elasticCalls) {
        context.elasticCalls.push(elasticCallsObj);
      } else {
        ContextTracker.assign({
          elasticCalls: [elasticCallsObj],
        });
      }
    }

    return await action();
  }
}
