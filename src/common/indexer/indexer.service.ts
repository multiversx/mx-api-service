import { LogPerformanceAsync } from "@elrondnetwork/erdnest";
import { Inject, Injectable } from "@nestjs/common";
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


  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountsCount(): Promise<number> {
    return await this.indexerInterface.getAccountsCount();
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getScResultsCount(): Promise<number> {
    return await this.indexerInterface.getScResultsCount();
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountContractsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountContractsCount(address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.indexerInterface.getBlocksCount(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    return await this.indexerInterface.getBlocks(filter, queryPagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getNftCollectionCount(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCountForAddress(address, filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getCollectionCountForAddress(address, filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCount(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftOwnersCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getNftOwnersCount(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerInterface.getTransfersCount(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokenCountForAddress(address: string): Promise<number> {
    return await this.indexerInterface.getTokenCountForAddress(address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    return await this.indexerInterface.getTokenAccountsCount(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getTokenAccounts(pagination, identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.indexerInterface.getTokensWithRolesForAddressCount(address, filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftTagCount(search?: string): Promise<number> {
    return await this.indexerInterface.getNftTagCount(search);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.indexerInterface.getRoundCount(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountScResultsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountScResultsCount(address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.indexerInterface.getTransactionCountForAddress(address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    return await this.indexerInterface.getTransactionCount(filter, address);
  }


  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getRound(shard: number, round: number): Promise<Round> {
    return await this.indexerInterface.getRound(shard, round);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getToken(identifier: string): Promise<Token> {
    return await this.indexerInterface.getToken(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getCollection(identifier: string): Promise<Collection> {
    return await this.indexerInterface.getCollection(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.indexerInterface.getTransaction(txHash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getScDeploy(address: string): Promise<ScDeploy> {
    return await this.indexerInterface.getScDeploy(address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getScResult(scHash: string): Promise<ScResult> {
    return await this.indexerInterface.getScResult(scHash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getBlock(hash: string): Promise<Block> {
    return await this.indexerInterface.getBlock(hash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getMiniBlock(miniBlockHash: string): Promise<MiniBlock> {
    return await this.indexerInterface.getMiniBlock(miniBlockHash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTag(tag: string): Promise<Tag> {
    return await this.indexerInterface.getTag(tag);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]> {
    return await this.indexerInterface.getTransfers(filter, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]> {
    return await this.indexerInterface.getTokensWithRolesForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getRounds(filter: RoundFilter): Promise<Round[]> {
    return await this.indexerInterface.getRounds(filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollections(pagination, filter, address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    return await this.indexerInterface.getNftTags(pagination, search);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]> {
    return await this.indexerInterface.getScResults(pagination, filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]> {
    return await this.indexerInterface.getAccountScResults(address, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return await this.indexerInterface.getAccounts(queryPagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountContracts(pagination: QueryPagination, address: string): Promise<ScDeploy[]> {
    return await this.indexerInterface.getAccountContracts(pagination, address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]> {
    return await this.indexerInterface.getAccountHistory(address, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountTokenHistory[]> {
    return await this.indexerInterface.getAccountTokenHistory(address, tokenIdentifier, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactions(filter, pagination, address);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]> {
    return await this.indexerInterface.getTokensForAddress(address, queryPagination, filter);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionLogs(hashes: string[]): Promise<TransactionLog[]> {
    return await this.indexerInterface.getTransactionLogs(hashes);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionScResults(txHash: string): Promise<ScResult[]> {
    return await this.indexerInterface.getTransactionScResults(txHash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]> {
    return await this.indexerInterface.getScResultsForTransactions(elasticTransactions);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountsEsdtByCollection(identifiers, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNftsForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNfts(pagination, filter, identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactionBySenderAndNonce(sender, nonce);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]> {
    return await this.indexerInterface.getTransactionReceipts(txHash);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllTokensMetadata(action);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getEsdtAccountsCount(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllAccountsWithToken(identifier, action);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.indexerInterface.getPublicKeys(shard, epoch);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number; }[]> {
    return await this.indexerInterface.getCollectionsForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAssetsForToken(identifier: string): Promise<TokenAssets> {
    return await this.indexerInterface.getAssetsForToken(identifier);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async setAssetsForToken(identifier: string, value: TokenAssets): Promise<void> {
    return await this.indexerInterface.setAssetsForToken(identifier, value);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void> {
    return await this.indexerInterface.setIsWhitelistedStorageForToken(identifier, value);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async setMediaForToken(identifier: string, value: NftMedia[]): Promise<void> {
    return await this.indexerInterface.setMediaForToken(identifier, value);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async setMetadataForToken(identifier: string, value: any): Promise<void> {
    return await this.indexerInterface.setMetadataForToken(identifier, value);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getNftCollectionsByIds(identifiers: string[]): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollectionsByIds(identifiers);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getSmartContractResults(transactionHashes: string[]): Promise<ScResult[]> {
    return await this.indexerInterface.getSmartContractResults(transactionHashes);
  }

  @LogPerformanceAsync(MetricsEvents.SetIndexerDuration)
  async getAccountsForAddresses(addresses: string[]): Promise<Account[]> {
    return await this.indexerInterface.getAccountsForAddresses(addresses);
  }
}
