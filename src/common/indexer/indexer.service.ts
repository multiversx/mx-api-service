import { PerformanceProfiler } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { QueryPagination } from "../entities/query.pagination";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { IndexerInterface } from "./indexer.interface";

@Injectable()
export class IndexerService implements IndexerInterface {
  constructor(
    @Inject('IndexerInterface')
    private readonly indexerInterface: IndexerInterface,
    @Inject(forwardRef(() => ApiMetricsService))
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

  async getCount(collection: string): Promise<number> {
    return await this.execute('getCount', this.indexerInterface.getCount(collection));
  }

  async getAccountContractsCount(address: string): Promise<number> {
    return await this.execute('getAccountContractsCount', this.indexerInterface.getAccountContractsCount(address));
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.execute('getBlocksCount', this.indexerInterface.getBlocksCount(filter));
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<any[]> {
    return await this.execute('getBlocks', this.indexerInterface.getBlocks(filter, queryPagination));
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.execute('getNftCollectionCount', this.indexerInterface.getNftCollectionCount(filter));
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    return await this.execute('getNftCountForAddress', this.indexerInterface.getNftCountForAddress(address, filter));
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    return await this.execute('getCollectionCountForAddress', this.indexerInterface.getCollectionCountForAddress(address, filter));
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.execute('getNftCount', this.indexerInterface.getNftCount(filter));
  }

  async getNftOwnersCount(identifier: string): Promise<number> {
    return await this.execute('getNftOwnersCount', this.indexerInterface.getNftOwnersCount(identifier));
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.execute('getTransfersCount', this.indexerInterface.getTransfersCount(filter));
  }

  async getTokenCountForAddress(address: string): Promise<number> {
    return await this.execute('getTokenCountForAddress', this.indexerInterface.getTokenCountForAddress(address));
  }

  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    return await this.execute('getTokenAccountsCount', this.indexerInterface.getTokenAccountsCount(identifier));
  }

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<any[]> {
    return await this.execute('getTokenAccounts', this.indexerInterface.getTokenAccounts(pagination, identifier));
  }

  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.execute('getTokensWithRolesForAddressCount', this.indexerInterface.getTokensWithRolesForAddressCount(address, filter));
  }

  async getNftTagCount(search?: string): Promise<number> {
    return await this.execute('getNftTagCount', this.indexerInterface.getNftTagCount(search));
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.execute('getRoundCount', this.indexerInterface.getRoundCount(filter));
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    return await this.execute('getAccountScResultsCount', this.indexerInterface.getAccountScResultsCount(address));
  }

  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.execute('getTransactionCountForAddress', this.indexerInterface.getTransactionCountForAddress(address));
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    return await this.execute('getTransactionCount', this.indexerInterface.getTransactionCount(filter, address));
  }

  async getItem(collection: string, key: string, identifier: string): Promise<any> {
    return await this.execute('getItem', this.indexerInterface.getItem(collection, key, identifier));
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getTransfers', this.indexerInterface.getTransfers(filter, pagination));
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getTokensWithRolesForAddress', this.indexerInterface.getTokensWithRolesForAddress(address, filter, pagination));
  }

  async getRounds(filter: RoundFilter): Promise<any[]> {
    return await this.execute('getRounds', this.indexerInterface.getRounds(filter));
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<any[]> {
    return await this.execute('getNftCollections', this.indexerInterface.getNftCollections(pagination, filter, address));
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    return await this.execute('getAccountEsdtByAddressesAndIdentifier', this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses));
  }

  async getNftTags(pagination: QueryPagination, search?: string): Promise<any[]> {
    return await this.execute('getNftTags', this.indexerInterface.getNftTags(pagination, search));
  }

  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<any[]> {
    return await this.execute('getScResults', this.indexerInterface.getScResults(pagination, filter));
  }

  async getAccountScResults(address: string, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountScResults', this.indexerInterface.getAccountScResults(address, pagination));
  }

  async getAccounts(queryPagination: QueryPagination): Promise<any[]> {
    return await this.execute('getAccounts', this.indexerInterface.getAccounts(queryPagination));
  }

  async getAccountContracts(pagination: QueryPagination, address: string): Promise<any[]> {
    return await this.execute('getAccountContracts', this.indexerInterface.getAccountContracts(pagination, address));
  }

  async getAccountHistory(address: string, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountHistory', this.indexerInterface.getAccountHistory(address, pagination));
  }

  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountTokenHistory', this.indexerInterface.getAccountTokenHistory(address, tokenIdentifier, pagination));
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<any[]> {
    return await this.execute('getTransactions', this.indexerInterface.getTransactions(filter, pagination, address));
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<any[]> {
    return await this.execute('getTokensForAddress', this.indexerInterface.getTokensForAddress(address, queryPagination, filter));
  }

  async getTransactionLogs(hashes: string[]): Promise<any[]> {
    return await this.execute('getTransactionLogs', this.indexerInterface.getTransactionLogs(hashes));
  }

  async getTransactionScResults(txHash: string): Promise<any[]> {
    return await this.execute('getTransactionScResults', this.indexerInterface.getTransactionScResults(txHash));
  }

  async getScResultsForTransactions(elasticTransactions: any[]): Promise<any[]> {
    return await this.execute('getScResultsForTransactions', this.indexerInterface.getScResultsForTransactions(elasticTransactions));
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<any[]> {
    return await this.execute('getAccountEsdtByIdentifiers', this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination));
  }

  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<any[]> {
    return await this.execute('getNftsForAddress', this.indexerInterface.getNftsForAddress(address, filter, pagination));
  }

  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<any[]> {
    return await this.execute('getNfts', this.indexerInterface.getNfts(pagination, filter, identifier));
  }

  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<any[]> {
    return await this.execute('getTransactionBySenderAndNonce', this.indexerInterface.getTransactionBySenderAndNonce(sender, nonce));
  }

  async getTransactionReceipts(txHash: string): Promise<any[]> {
    return await this.execute('getTransactionReceipts', this.indexerInterface.getTransactionReceipts(txHash));
  }

  async getAllTokensMetadata(action: (items: any[]) => Promise<void>): Promise<void> {
    return await this.execute('getAllTokensMetadata', this.indexerInterface.getAllTokensMetadata(action));
  }

  async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.execute('getEsdtAccountsCount', this.indexerInterface.getEsdtAccountsCount(identifier));
  }

  async getAllAccountsWithToken(identifier: string, action: (items: any[]) => Promise<void>): Promise<void> {
    return await this.execute('getAllAccountsWithToken', this.indexerInterface.getAllAccountsWithToken(identifier, action));
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    return await this.execute('getCustomValue', this.indexerInterface.getCustomValue(collection, identifier, attribute));
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    return await this.execute('setCustomValue', this.indexerInterface.setCustomValue(collection, identifier, attribute, value));
  }

  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.execute('getPublicKeys', this.indexerInterface.getPublicKeys(shard, epoch));
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number }[]> {
    return await this.execute('getCollectionsForAddress', this.indexerInterface.getCollectionsForAddress(address, filter, pagination));
  }
}
