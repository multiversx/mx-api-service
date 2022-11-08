import { PerformanceProfiler } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TokenAssets } from "../assets/entities/token.assets";
import { QueryPagination } from "../entities/query.pagination";
import { ApiMetricsService } from "../metrics/api.metrics.service";
import { Account, AccountHistory, AccountTokenHistory, Block, Collection, MiniBlock, Operation, Round, ScDeploy, ScResult, Tag, Token, TokenAccount, Transaction, TransactionLog, TransactionReceipt } from "./entities";
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

  async getAccountsCount(): Promise<number> {
    return await this.execute('getAccountsCount', this.indexerInterface.getAccountsCount());
  }

  async getScResultsCount(): Promise<number> {
    return await this.execute('getScResultsCount', this.indexerInterface.getScResultsCount());
  }

  async getAccountContractsCount(address: string): Promise<number> {
    return await this.execute('getAccountContractsCount', this.indexerInterface.getAccountContractsCount(address));
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.execute('getBlocksCount', this.indexerInterface.getBlocksCount(filter));
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
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

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]> {
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

  async getRound(shard: number, round: number): Promise<Round> {
    return await this.execute('getRound', this.indexerInterface.getRound(shard, round));
  }

  async getToken(identifier: string): Promise<Token> {
    return await this.execute('getToken', this.indexerInterface.getToken(identifier));
  }

  async getCollection(identifier: string): Promise<Collection> {
    return await this.execute('getCollection', this.indexerInterface.getCollection(identifier));
  }

  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.execute('getTransaction', this.indexerInterface.getTransaction(txHash));
  }

  async getScDeploy(address: string): Promise<ScDeploy> {
    return await this.execute('getScDeploy', this.indexerInterface.getScDeploy(address));
  }

  async getScResult(scHash: string): Promise<ScResult> {
    return await this.execute('getScResult', this.indexerInterface.getScResult(scHash));
  }

  async getBlock(hash: string): Promise<Block> {
    return await this.execute('getBlock', this.indexerInterface.getBlock(hash));
  }

  async getMiniBlock(miniBlockHash: string): Promise<MiniBlock> {
    return await this.execute('getMiniBlock', this.indexerInterface.getMiniBlock(miniBlockHash));
  }

  async getTag(tag: string): Promise<Tag> {
    return await this.execute('getTag', this.indexerInterface.getTag(tag));
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]> {
    return await this.execute('getTransfers', this.indexerInterface.getTransfers(filter, pagination));
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]> {
    return await this.execute('getTokensWithRolesForAddress', this.indexerInterface.getTokensWithRolesForAddress(address, filter, pagination));
  }

  async getRounds(filter: RoundFilter): Promise<Round[]> {
    return await this.execute('getRounds', this.indexerInterface.getRounds(filter));
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]> {
    return await this.execute('getNftCollections', this.indexerInterface.getNftCollections(pagination, filter, address));
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]> {
    return await this.execute('getAccountEsdtByAddressesAndIdentifier', this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses));
  }

  async getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    return await this.execute('getNftTags', this.indexerInterface.getNftTags(pagination, search));
  }

  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]> {
    return await this.execute('getScResults', this.indexerInterface.getScResults(pagination, filter));
  }

  async getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]> {
    return await this.execute('getAccountScResults', this.indexerInterface.getAccountScResults(address, pagination));
  }

  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return await this.execute('getAccounts', this.indexerInterface.getAccounts(queryPagination));
  }

  async getAccountContracts(pagination: QueryPagination, address: string): Promise<ScDeploy[]> {
    return await this.execute('getAccountContracts', this.indexerInterface.getAccountContracts(pagination, address));
  }

  async getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]> {
    return await this.execute('getAccountHistory', this.indexerInterface.getAccountHistory(address, pagination));
  }

  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountTokenHistory[]> {
    return await this.execute('getAccountTokenHistory', this.indexerInterface.getAccountTokenHistory(address, tokenIdentifier, pagination));
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]> {
    return await this.execute('getTransactions', this.indexerInterface.getTransactions(filter, pagination, address));
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]> {
    return await this.execute('getTokensForAddress', this.indexerInterface.getTokensForAddress(address, queryPagination, filter));
  }

  async getTransactionLogs(hashes: string[]): Promise<TransactionLog[]> {
    return await this.execute('getTransactionLogs', this.indexerInterface.getTransactionLogs(hashes));
  }

  async getTransactionScResults(txHash: string): Promise<ScResult[]> {
    return await this.execute('getTransactionScResults', this.indexerInterface.getTransactionScResults(txHash));
  }

  async getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]> {
    return await this.execute('getScResultsForTransactions', this.indexerInterface.getScResultsForTransactions(elasticTransactions));
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.execute('getAccountEsdtByIdentifiers', this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination));
  }

  async getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.execute('getAccountsEsdtByCollection', this.indexerInterface.getAccountsEsdtByCollection(identifiers, pagination));
  }

  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]> {
    return await this.execute('getNftsForAddress', this.indexerInterface.getNftsForAddress(address, filter, pagination));
  }

  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]> {
    return await this.execute('getNfts', this.indexerInterface.getNfts(pagination, filter, identifier));
  }

  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]> {
    return await this.execute('getTransactionBySenderAndNonce', this.indexerInterface.getTransactionBySenderAndNonce(sender, nonce));
  }

  async getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]> {
    return await this.execute('getTransactionReceipts', this.indexerInterface.getTransactionReceipts(txHash));
  }

  async getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void> {
    return await this.execute('getAllTokensMetadata', this.indexerInterface.getAllTokensMetadata(action));
  }

  async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.execute('getEsdtAccountsCount', this.indexerInterface.getEsdtAccountsCount(identifier));
  }

  async getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void> {
    return await this.execute('getAllAccountsWithToken', this.indexerInterface.getAllAccountsWithToken(identifier, action));
  }

  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.execute('getPublicKeys', this.indexerInterface.getPublicKeys(shard, epoch));
  }

  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number; }[]> {
    return await this.execute('getCollectionsForAddress', this.indexerInterface.getCollectionsForAddress(address, filter, pagination));
  }

  async getAssetsForToken(identifier: string): Promise<TokenAssets> {
    return await this.execute('getAssetsForToken', this.indexerInterface.getAssetsForToken(identifier));
  }

  async setAssetsForToken(identifier: string, value: TokenAssets): Promise<void> {
    return await this.execute('setAssetsForToken', this.indexerInterface.setAssetsForToken(identifier, value));
  }

  async setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void> {
    return await this.execute('setIsWhitelistedStorageForToken', this.indexerInterface.setIsWhitelistedStorageForToken(identifier, value));
  }

  async setMediaForToken(identifier: string, value: NftMedia[]): Promise<void> {
    return await this.execute('setMediaForToken', this.indexerInterface.setMediaForToken(identifier, value));
  }

  async setMetadataForToken(identifier: string, value: any): Promise<void> {
    return await this.execute('setMetadataForToken', this.indexerInterface.setMetadataForToken(identifier, value));
  }

  async getNftCollectionsByIds(identifiers: string[]): Promise<Collection[]> {
    return await this.execute('getNftCollectionsByIds', this.indexerInterface.getNftCollectionsByIds(identifiers));
  }

  async getSmartContractResults(transactionHashes: string[]): Promise<ScResult[]> {
    return await this.execute('getSmartContractResults', this.indexerInterface.getSmartContractResults(transactionHashes));
  }

  async getAccountsForAddresses(addresses: string[]): Promise<Account[]> {
    return await this.execute('getAccountsForAddresses', this.indexerInterface.getAccountsForAddresses(addresses));
  }
}
