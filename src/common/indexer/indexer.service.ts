import { ElasticQuery, PerformanceProfiler } from "@elrondnetwork/erdnest";
import { Inject, Injectable } from "@nestjs/common";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { IndexerInterface } from "./indexer.interface";

@Injectable()
export class IndexerService implements IndexerInterface {
  constructor(
    @Inject('IndexerInterface')
    private readonly indexerInterface: IndexerInterface,
    private readonly metricsService: ApiMetricsService,
  ) { }

  private async execute<T>(key: string, action: Promise<T>): Promise<T> {
    const profiler = new PerformanceProfiler();

    try {
      return await action;
    } finally {
      profiler.stop();

      this.metricsService.setIndexerDuration(key, profiler.duration);
    }
  }

  async getCount(collection: string, elasticQuery?: ElasticQuery): Promise<number> {
    return await this.execute('getCount', this.indexerInterface.getCount(collection, elasticQuery));
  }

  async getItem(collection: string, key: string, identifier: string): Promise<any> {
    return await this.execute('getItem', this.indexerInterface.getItem(collection, key, identifier));
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    return await this.execute('getList', this.indexerInterface.getList(collection, key, elasticQuery, overrideUrl));
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void> {
    return await this.execute('getScrollableList', this.indexerInterface.getScrollableList(collection, key, elasticQuery, action));
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    return await this.execute('getCustomValue', this.indexerInterface.getCustomValue(collection, identifier, attribute));
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    return await this.execute('setCustomValue', this.indexerInterface.setCustomValue(collection, identifier, attribute, value));
  }

  async get(url: string): Promise<any> {
    return await this.execute('get', this.indexerInterface.get(url));
  }

  async post(url: string, body: any): Promise<any> {
    return await this.execute('post', this.indexerInterface.post(url, body));
  }
}
