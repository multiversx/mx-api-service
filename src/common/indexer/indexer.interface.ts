import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { QueryPagination } from "../entities/query.pagination";

export interface IndexerInterface {
  getCustomValue(collection: string, identifier: string, attribute: string): Promise<any>

  setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void>

  getCount(collection: string, elasticQuery?: any): Promise<number>

  getItem(collection: string, key: string, identifier: string): Promise<any | undefined>

  getList(collection: string, key: string, elasticQuery: any, overrideUrl?: string): Promise<any[]>

  getScrollableList(collection: string, key: string, elasticQuery: any, action: (items: any[]) => Promise<void>): Promise<void>

  getAccountEsdtByIdentifier(identifier: string, pagination?: QueryPagination): Promise<any[]>

  getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]>

  getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<any[]>

  getAccountEsdtByAddressCount(address: string): Promise<number>

  getLogsForTransactionHashes(elasticQuery: any): Promise<TransactionLog[]>
}
