import { Inject, Injectable } from "@nestjs/common";
import { LogPerformanceAsync } from "src/decorators/log.performance.decorators";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftMedia } from "src/endpoints/nfts/entities/nft.media";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { TokenAssets } from "../assets/entities/token.assets";
import { QueryPagination } from "../entities/query.pagination";
import { Account, AccountHistory, AccountTokenHistory, Block, Collection, MiniBlock, Operation, Round, ScDeploy, ScResult, Tag, Token, TokenAccount, Transaction, TransactionLog, TransactionReceipt } from "./entities";
import { IndexerInterface } from "./indexer.interface";

@Injectable()
export class IndexerService implements IndexerInterface {
  constructor(
    @Inject('IndexerInterface')
    private readonly indexerInterface: IndexerInterface,
  ) { }


  @LogIndexerPerformanceAsync()
  async getAccountsCount(): Promise<number> {
    return await this.indexerInterface.getAccountsCount();
  }

  @LogIndexerPerformanceAsync()
  async getScResultsCount(): Promise<number> {
    return await this.indexerInterface.getScResultsCount();
  }

  @LogIndexerPerformanceAsync()
  async getAccountContractsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountContractsCount(address);
  }

  @LogIndexerPerformanceAsync()
  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.indexerInterface.getBlocksCount(filter);
  }

  @LogIndexerPerformanceAsync()
  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    return await this.indexerInterface.getBlocks(filter, queryPagination);
  }

  @LogIndexerPerformanceAsync()
  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getNftCollectionCount(filter);
  }

  @LogIndexerPerformanceAsync()
  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCountForAddress(address, filter);
  }

  @LogIndexerPerformanceAsync()
  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getCollectionCountForAddress(address, filter);
  }

  @LogIndexerPerformanceAsync()
  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCount(filter);
  }

  @LogIndexerPerformanceAsync()
  async getNftOwnersCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getNftOwnersCount(identifier);
  }

  @LogIndexerPerformanceAsync()
  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerInterface.getTransfersCount(filter);
  }

  @LogIndexerPerformanceAsync()
  async getTokenCountForAddress(address: string): Promise<number> {
    return await this.indexerInterface.getTokenCountForAddress(address);
  }

  @LogIndexerPerformanceAsync()
  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    return await this.indexerInterface.getTokenAccountsCount(identifier);
  }

  @LogIndexerPerformanceAsync()
  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getTokenAccounts(pagination, identifier);
  }

  @LogIndexerPerformanceAsync()
  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.indexerInterface.getTokensWithRolesForAddressCount(address, filter);
  }

  @LogIndexerPerformanceAsync()
  async getNftTagCount(search?: string): Promise<number> {
    return await this.indexerInterface.getNftTagCount(search);
  }

  @LogIndexerPerformanceAsync()
  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.indexerInterface.getRoundCount(filter);
  }

  @LogIndexerPerformanceAsync()
  async getAccountScResultsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountScResultsCount(address);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.indexerInterface.getTransactionCountForAddress(address);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    return await this.indexerInterface.getTransactionCount(filter, address);
  }


  @LogIndexerPerformanceAsync()
  async getRound(shard: number, round: number): Promise<Round> {
    return await this.indexerInterface.getRound(shard, round);
  }

  @LogIndexerPerformanceAsync()
  async getToken(identifier: string): Promise<Token> {
    return await this.indexerInterface.getToken(identifier);
  }

  @LogIndexerPerformanceAsync()
  async getCollection(identifier: string): Promise<Collection> {
    return await this.indexerInterface.getCollection(identifier);
  }

  @LogIndexerPerformanceAsync()
  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.indexerInterface.getTransaction(txHash);
  }

  @LogIndexerPerformanceAsync()
  async getScDeploy(address: string): Promise<ScDeploy> {
    return await this.indexerInterface.getScDeploy(address);
  }

  @LogIndexerPerformanceAsync()
  async getScResult(scHash: string): Promise<ScResult> {
    return await this.indexerInterface.getScResult(scHash);
  }

  @LogIndexerPerformanceAsync()
  async getBlock(hash: string): Promise<Block> {
    return await this.indexerInterface.getBlock(hash);
  }

  @LogIndexerPerformanceAsync()
  async getMiniBlock(miniBlockHash: string): Promise<MiniBlock> {
    return await this.indexerInterface.getMiniBlock(miniBlockHash);
  }

  @LogIndexerPerformanceAsync()
  async getTag(tag: string): Promise<Tag> {
    return await this.indexerInterface.getTag(tag);
  }

  @LogIndexerPerformanceAsync()
  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]> {
    return await this.indexerInterface.getTransfers(filter, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]> {
    return await this.indexerInterface.getTokensWithRolesForAddress(address, filter, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getRounds(filter: RoundFilter): Promise<Round[]> {
    return await this.indexerInterface.getRounds(filter);
  }

  @LogIndexerPerformanceAsync()
  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollections(pagination, filter, address);
  }

  @LogIndexerPerformanceAsync()
  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);
  }

  @LogIndexerPerformanceAsync()
  async getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    return await this.indexerInterface.getNftTags(pagination, search);
  }

  @LogIndexerPerformanceAsync()
  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]> {
    return await this.indexerInterface.getScResults(pagination, filter);
  }

  @LogIndexerPerformanceAsync()
  async getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]> {
    return await this.indexerInterface.getAccountScResults(address, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return await this.indexerInterface.getAccounts(queryPagination);
  }

  @LogIndexerPerformanceAsync()
  async getAccountContracts(pagination: QueryPagination, address: string): Promise<ScDeploy[]> {
    return await this.indexerInterface.getAccountContracts(pagination, address);
  }

  @LogIndexerPerformanceAsync()
  async getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]> {
    return await this.indexerInterface.getAccountHistory(address, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountTokenHistory[]> {
    return await this.indexerInterface.getAccountTokenHistory(address, tokenIdentifier, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactions(filter, pagination, address);
  }

  @LogIndexerPerformanceAsync()
  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]> {
    return await this.indexerInterface.getTokensForAddress(address, queryPagination, filter);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionLogs(hashes: string[]): Promise<TransactionLog[]> {
    return await this.indexerInterface.getTransactionLogs(hashes);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionScResults(txHash: string): Promise<ScResult[]> {
    return await this.indexerInterface.getTransactionScResults(txHash);
  }

  @LogIndexerPerformanceAsync()
  async getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]> {
    return await this.indexerInterface.getScResultsForTransactions(elasticTransactions);
  }

  @LogIndexerPerformanceAsync()
  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountsEsdtByCollection(identifiers, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNftsForAddress(address, filter, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNfts(pagination, filter, identifier);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactionBySenderAndNonce(sender, nonce);
  }

  @LogIndexerPerformanceAsync()
  async getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]> {
    return await this.indexerInterface.getTransactionReceipts(txHash);
  }

  @LogIndexerPerformanceAsync()
  async getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllTokensMetadata(action);
  }

  @LogIndexerPerformanceAsync()
  async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getEsdtAccountsCount(identifier);
  }

  @LogIndexerPerformanceAsync()
  async getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllAccountsWithToken(identifier, action);
  }

  @LogIndexerPerformanceAsync()
  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.indexerInterface.getPublicKeys(shard, epoch);
  }

  @LogIndexerPerformanceAsync()
  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number; }[]> {
    return await this.indexerInterface.getCollectionsForAddress(address, filter, pagination);
  }

  @LogIndexerPerformanceAsync()
  async getAssetsForToken(identifier: string): Promise<TokenAssets> {
    return await this.indexerInterface.getAssetsForToken(identifier);
  }

  @LogIndexerPerformanceAsync()
  async setAssetsForToken(identifier: string, value: TokenAssets): Promise<void> {
    return await this.indexerInterface.setAssetsForToken(identifier, value);
  }

  @LogIndexerPerformanceAsync()
  async setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void> {
    return await this.indexerInterface.setIsWhitelistedStorageForToken(identifier, value);
  }

  @LogIndexerPerformanceAsync()
  async setMediaForToken(identifier: string, value: NftMedia[]): Promise<void> {
    return await this.indexerInterface.setMediaForToken(identifier, value);
  }

  @LogIndexerPerformanceAsync()
  async setMetadataForToken(identifier: string, value: any): Promise<void> {
    return await this.indexerInterface.setMetadataForToken(identifier, value);
  }

  @LogIndexerPerformanceAsync()
  async getNftCollectionsByIds(identifiers: string[]): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollectionsByIds(identifiers);
  }

  @LogIndexerPerformanceAsync()
  async getSmartContractResults(transactionHashes: string[]): Promise<ScResult[]> {
    return await this.indexerInterface.getSmartContractResults(transactionHashes);
  }

  @LogIndexerPerformanceAsync()
  async getAccountsForAddresses(addresses: string[]): Promise<Account[]> {
    return await this.indexerInterface.getAccountsForAddresses(addresses);
  }
}

export function LogIndexerPerformanceAsync() {
  return LogPerformanceAsync(MetricsEvents.SetIndexerDuration);
}
