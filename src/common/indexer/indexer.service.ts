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


  @LogPerformanceAsync('setIndexerDuration', 'getAccountsCount')
  async getAccountsCount(): Promise<number> {
    return await this.indexerInterface.getAccountsCount();
  }

  @LogPerformanceAsync('setIndexerDuration', 'getScResultsCount')
  async getScResultsCount(): Promise<number> {
    return await this.indexerInterface.getScResultsCount();
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountContractsCount')
  async getAccountContractsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountContractsCount(address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getBlocksCount')
  async getBlocksCount(filter: BlockFilter): Promise<number> {
    return await this.indexerInterface.getBlocksCount(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getBlocks')
  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    return await this.indexerInterface.getBlocks(filter, queryPagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftCollectionCount')
  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getNftCollectionCount(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftCountForAddress')
  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCountForAddress(address, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getCollectionCountForAddress')
  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    return await this.indexerInterface.getCollectionCountForAddress(address, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftCount')
  async getNftCount(filter: NftFilter): Promise<number> {
    return await this.indexerInterface.getNftCount(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftOwnersCount')
  async getNftOwnersCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getNftOwnersCount(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransfersCount')
  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerInterface.getTransfersCount(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokenCountForAddress')
  async getTokenCountForAddress(address: string, filter: TokenFilter): Promise<number> {
    return await this.indexerInterface.getTokenCountForAddress(address, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokenAccountsCount')
  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    return await this.indexerInterface.getTokenAccountsCount(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokenAccounts')
  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getTokenAccounts(pagination, identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokensWithRolesForAddressCount')
  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    return await this.indexerInterface.getTokensWithRolesForAddressCount(address, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftTagCount')
  async getNftTagCount(search?: string): Promise<number> {
    return await this.indexerInterface.getNftTagCount(search);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getRoundCount')
  async getRoundCount(filter: RoundFilter): Promise<number> {
    return await this.indexerInterface.getRoundCount(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountScResultsCount')
  async getAccountScResultsCount(address: string): Promise<number> {
    return await this.indexerInterface.getAccountScResultsCount(address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionCountForAddress')
  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.indexerInterface.getTransactionCountForAddress(address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionCount')
  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    return await this.indexerInterface.getTransactionCount(filter, address);
  }


  @LogPerformanceAsync('setIndexerDuration', 'getRound')
  async getRound(shard: number, round: number): Promise<Round> {
    return await this.indexerInterface.getRound(shard, round);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getToken')
  async getToken(identifier: string): Promise<Token> {
    return await this.indexerInterface.getToken(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getCollection')
  async getCollection(identifier: string): Promise<Collection> {
    return await this.indexerInterface.getCollection(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransaction')
  async getTransaction(txHash: string): Promise<Transaction | null> {
    return await this.indexerInterface.getTransaction(txHash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getScDeploy')
  async getScDeploy(address: string): Promise<ScDeploy> {
    return await this.indexerInterface.getScDeploy(address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getScResult')
  async getScResult(scHash: string): Promise<ScResult> {
    return await this.indexerInterface.getScResult(scHash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getBlock')
  async getBlock(hash: string): Promise<Block> {
    return await this.indexerInterface.getBlock(hash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getMiniBlock')
  async getMiniBlock(miniBlockHash: string): Promise<MiniBlock> {
    return await this.indexerInterface.getMiniBlock(miniBlockHash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTag')
  async getTag(tag: string): Promise<Tag> {
    return await this.indexerInterface.getTag(tag);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransfers')
  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]> {
    return await this.indexerInterface.getTransfers(filter, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokensWithRolesForAddress')
  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]> {
    return await this.indexerInterface.getTokensWithRolesForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getRounds')
  async getRounds(filter: RoundFilter): Promise<Round[]> {
    return await this.indexerInterface.getRounds(filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftCollections')
  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollections(pagination, filter, address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountEsdtByAddressesAndIdentifier')
  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByAddressesAndIdentifier(identifier, addresses);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftTags')
  async getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]> {
    return await this.indexerInterface.getNftTags(pagination, search);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getScResults')
  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]> {
    return await this.indexerInterface.getScResults(pagination, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountScResults')
  async getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]> {
    return await this.indexerInterface.getAccountScResults(address, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccounts')
  async getAccounts(queryPagination: QueryPagination): Promise<Account[]> {
    return await this.indexerInterface.getAccounts(queryPagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountContracts')
  async getAccountContracts(pagination: QueryPagination, address: string): Promise<ScDeploy[]> {
    return await this.indexerInterface.getAccountContracts(pagination, address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountHistory')
  async getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]> {
    return await this.indexerInterface.getAccountHistory(address, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountTokenHistory')
  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountTokenHistory[]> {
    return await this.indexerInterface.getAccountTokenHistory(address, tokenIdentifier, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactions')
  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactions(filter, pagination, address);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTokensForAddress')
  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]> {
    return await this.indexerInterface.getTokensForAddress(address, queryPagination, filter);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionLogs')
  async getTransactionLogs(hashes: string[]): Promise<TransactionLog[]> {
    return await this.indexerInterface.getTransactionLogs(hashes);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionScResults')
  async getTransactionScResults(txHash: string): Promise<ScResult[]> {
    return await this.indexerInterface.getTransactionScResults(txHash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getScResultsForTransactions')
  async getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]> {
    return await this.indexerInterface.getScResultsForTransactions(elasticTransactions);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountEsdtByIdentifiers')
  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountEsdtByIdentifiers(identifiers, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountsEsdtByCollection')
  async getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getAccountsEsdtByCollection(identifiers, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftsForAddress')
  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNftsForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNfts')
  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]> {
    return await this.indexerInterface.getNfts(pagination, filter, identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionBySenderAndNonce')
  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]> {
    return await this.indexerInterface.getTransactionBySenderAndNonce(sender, nonce);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getTransactionReceipts')
  async getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]> {
    return await this.indexerInterface.getTransactionReceipts(txHash);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAllTokensMetadata')
  async getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllTokensMetadata(action);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getEsdtAccountsCount')
  async getEsdtAccountsCount(identifier: string): Promise<number> {
    return await this.indexerInterface.getEsdtAccountsCount(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAllAccountsWithToken')
  async getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void> {
    return await this.indexerInterface.getAllAccountsWithToken(identifier, action);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getPublicKeys')
  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    return await this.indexerInterface.getPublicKeys(shard, epoch);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getCollectionsForAddress')
  async getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number; }[]> {
    return await this.indexerInterface.getCollectionsForAddress(address, filter, pagination);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAssetsForToken')
  async getAssetsForToken(identifier: string): Promise<TokenAssets> {
    return await this.indexerInterface.getAssetsForToken(identifier);
  }

  @LogPerformanceAsync('setIndexerDuration', 'setAssetsForToken')
  async setAssetsForToken(identifier: string, value: TokenAssets): Promise<void> {
    return await this.indexerInterface.setAssetsForToken(identifier, value);
  }

  @LogPerformanceAsync('setIndexerDuration', 'setIsWhitelistedStorageForToken')
  async setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void> {
    return await this.indexerInterface.setIsWhitelistedStorageForToken(identifier, value);
  }

  @LogPerformanceAsync('setIndexerDuration', 'setMediaForToken')
  async setMediaForToken(identifier: string, value: NftMedia[]): Promise<void> {
    return await this.indexerInterface.setMediaForToken(identifier, value);
  }

  @LogPerformanceAsync('setIndexerDuration', 'setMetadataForToken')
  async setMetadataForToken(identifier: string, value: any): Promise<void> {
    return await this.indexerInterface.setMetadataForToken(identifier, value);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getNftCollectionsByIds')
  async getNftCollectionsByIds(identifiers: string[]): Promise<Collection[]> {
    return await this.indexerInterface.getNftCollectionsByIds(identifiers);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getSmartContractResults')
  async getSmartContractResults(transactionHashes: string[]): Promise<ScResult[]> {
    return await this.indexerInterface.getSmartContractResults(transactionHashes);
  }

  @LogPerformanceAsync('setIndexerDuration', 'getAccountsForAddresses')
  async getAccountsForAddresses(addresses: string[]): Promise<Account[]> {
    return await this.indexerInterface.getAccountsForAddresses(addresses);
  }
}
