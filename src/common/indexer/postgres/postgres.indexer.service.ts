import { ElasticQuery } from "@elrondnetwork/erdnest";
import { Injectable } from "@nestjs/common";
import { IndexerInterface } from "../indexer.interface";

@Injectable()
export class PostgresIndexerService implements IndexerInterface {
  constructor() { }

  // eslint-disable-next-line require-await
  async getCount(_collection: string, _elasticQuery?: ElasticQuery): Promise<number> {
    return 0;
  }

  // eslint-disable-next-line require-await
  async getItem(_collection: string, _key: string, _identifier: string): Promise<any> {
    return {};
  }

  // eslint-disable-next-line require-await
  async getList(_collection: string, _key: string, _elasticQuery: ElasticQuery, _overrideUrl?: string): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line require-await
  async getScrollableList(_collection: string, _key: string, _elasticQuery: ElasticQuery, _action: (items: any[]) => Promise<void>): Promise<void> {
    return;
  }

  // eslint-disable-next-line require-await
  async getCustomValue(_collection: string, _identifier: string, _attribute: string): Promise<any> {
    return {};
  }

  // eslint-disable-next-line require-await
  async setCustomValue<T>(_collection: string, _identifier: string, _attribute: string, _value: T): Promise<void> {
    return;
  }

  // eslint-disable-next-line require-await
  async get(_url: string): Promise<any> {
    return {};
  }

  // eslint-disable-next-line require-await
  async post(_url: string, _body: any): Promise<any> {
    return {};
  }
}
