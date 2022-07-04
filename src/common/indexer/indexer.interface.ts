import { ElasticQuery } from "@elrondnetwork/erdnest";

export interface IndexerInterface {
  getCount(collection: string, elasticQuery?: ElasticQuery): Promise<number>

  getItem(collection: string, key: string, identifier: string): Promise<any>

  getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]>

  getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void>

  getCustomValue(collection: string, identifier: string, attribute: string): Promise<any>

  setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void>

  get(url: string): Promise<any>

  post(url: string, body: any): Promise<any>
}
