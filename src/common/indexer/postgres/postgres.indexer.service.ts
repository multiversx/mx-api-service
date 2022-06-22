import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { IndexerInterface } from "../indexer.interface";

@Injectable()
export class PostgresIndexerService implements IndexerInterface {
  constructor() { }

  // eslint-disable-next-line require-await
  async getCustomValue(_collection: string, _identifier: string, _attribute: string): Promise<any> {
    return {};
  }

  // eslint-disable-next-line require-await
  async setCustomValue<T>(_collection: string, _identifier: string, _attribute: string, _value: T): Promise<void> {
  }

  // eslint-disable-next-line require-await
  async getCount(_collection: string, _elasticQuery?: any): Promise<number> {
    return 0;
  }

  // eslint-disable-next-line require-await
  async getItem(_collection: string, _key: string, _identifier: string): Promise<any> {
    return {};
  }

  // eslint-disable-next-line require-await
  async getList(_collection: string, _key: string, _elasticQuery: any, _overrideUrl?: string): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line require-await
  async getScrollableList(_collection: string, _key: string, _elasticQuery: any, _action: (items: any[]) => Promise<void>): Promise<void> {
  }

  // eslint-disable-next-line require-await
  async getAccountEsdtByIdentifier(_identifier: string, _pagination?: QueryPagination): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line require-await
  async getAccountEsdtByAddressesAndIdentifier(_identifier: string, _addresses: string[]): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line require-await
  async getAccountEsdtByIdentifiers(_identifiers: string[], _pagination?: QueryPagination): Promise<any[]> {
    return [];
  }

  // eslint-disable-next-line require-await
  async getAccountEsdtByAddressCount(_address: string): Promise<number> {
    return 0;
  }

  // eslint-disable-next-line require-await
  async getLogsForTransactionHashes(_elasticQuery: any): Promise<TransactionLog[]> {
    return [];
  }
}
