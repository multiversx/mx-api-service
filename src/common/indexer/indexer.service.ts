import { Inject, Injectable } from "@nestjs/common";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { QueryPagination } from "../entities/query.pagination";
import { MetricsService } from "../metrics/metrics.service";
import { IndexerInterface } from "./indexer.interface";

@Injectable()
export class IndexerService implements IndexerInterface {
  constructor(
    @Inject('IndexerInterface')
    private readonly indexerInterface: IndexerInterface,
    private readonly metricsService: MetricsService,
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

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    return await this.execute('getCustomValue', this.indexerInterface.getCustomValue(collection, identifier, attribute));
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    return await this.execute('setCustomValue', this.indexerInterface.setCustomValue(collection, identifier, attribute, value));
  }

  async getCount(collection: string, elasticQuery?: any): Promise<number> {
    return await this.execute('getCount', this.indexerInterface.getCount(collection, elasticQuery));
  }

  async getItem(collection: string, key: string, identifier: string): Promise<any> {
    return await this.execute('getItem', this.indexerInterface.getItem(collection, key, identifier));
  }

  async getList(collection: string, key: string, elasticQuery: any, overrideUrl?: string): Promise<any[]> {
    return await this.execute('getList', this.indexerInterface.getList(collection, key, elasticQuery, overrideUrl));
  }

  async getScrollableList(collection: string, key: string, elasticQuery: any, action: (items: any[]) => Promise<void>): Promise<void> {
    return await this.execute('getScrollableList', this.indexerInterface.getScrollableList(collection, key, elasticQuery, action));
  }

  async getAccountEsdtByIdentifier(identifier: string, pagination?: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountEsdtByIdentifier', this.indexerInterface.getAccountEsdtByIdentifier(identifier, pagination));
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    return await this.execute('getAccountEsdtByAddressesAndIdentifier', this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses));
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountEsdtByIdentifiers', this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination));
  }

  async getAccountEsdtByAddressCount(address: string): Promise<number> {
    return await this.execute('getAccountEsdtByAddressCount', this.indexerInterface.getAccountEsdtByAddressCount(address));
  }

  async getLogsForTransactionHashes(elasticQuery: any): Promise<TransactionLog[]> {
    return await this.execute('getLogsForTransactionHashes', this.indexerInterface.getLogsForTransactionHashes(elasticQuery));
  }
}
