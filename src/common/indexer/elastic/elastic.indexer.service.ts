import { Injectable } from "@nestjs/common";
import { ElasticService, ElasticQuery } from "@elrondnetwork/erdnest";
import { IndexerInterface } from "../indexer.interface";

@Injectable()
export class ElasticIndexerService implements IndexerInterface {
  constructor(
    private readonly elasticService: ElasticService,
  ) { }

  async getCount(collection: string, elasticQuery?: ElasticQuery): Promise<number> {
    return await this.elasticService.getCount(collection, elasticQuery);
  }

  async getItem(collection: string, key: string, identifier: string): Promise<any> {
    return await this.elasticService.getItem(collection, key, identifier);
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    return await this.elasticService.getList(collection, key, elasticQuery, overrideUrl);
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void> {
    return await this.elasticService.getScrollableList(collection, key, elasticQuery, action);
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    return await this.elasticService.getCustomValue(collection, identifier, attribute);
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    return await this.elasticService.setCustomValue(collection, identifier, attribute, value);
  }

  async get(url: string): Promise<any> {
    return await this.elasticService.get(url);
  }

  async post(url: string, body: any): Promise<any> {
    await this.elasticService.post(url, body);
  }
}
