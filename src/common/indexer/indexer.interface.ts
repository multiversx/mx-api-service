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

export interface IndexerInterface {
  getAccountsCount(): Promise<number>

  getScResultsCount(): Promise<number>

  getAccountContractsCount(address: string): Promise<number>

  getBlocksCount(filter: BlockFilter): Promise<number>

  getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]>

  getNftCollectionCount(filter: CollectionFilter): Promise<number>

  getNftCountForAddress(address: string, filter: NftFilter): Promise<number>

  getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number>

  getNftCount(filter: NftFilter): Promise<number>

  getNftOwnersCount(identifier: string): Promise<number>

  getTransfersCount(filter: TransactionFilter): Promise<number>

  getTokenCountForAddress(address: string): Promise<number>

  getTokenAccountsCount(identifier: string): Promise<number | undefined>

  getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<TokenAccount[]>

  getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number>

  getNftTagCount(search?: string): Promise<number>

  getRoundCount(filter: RoundFilter): Promise<number>

  getAccountScResultsCount(address: string): Promise<number>

  getTransactionCountForAddress(address: string): Promise<number>

  getTransactionCount(filter: TransactionFilter, address?: string): Promise<number>

  getRound(shard: number, round: number): Promise<Round>

  getToken(identifier: string): Promise<Token>

  getCollection(identifier: string): Promise<Collection>

  getTransaction(txHash: string): Promise<Transaction>

  getScDeploy(address: string): Promise<ScDeploy>

  getScResult(scHash: string): Promise<ScResult>

  getBlock(hash: string): Promise<Block>

  getMiniBlock(miniBlockHash: string): Promise<MiniBlock>

  getTag(tag: string): Promise<Tag>

  getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<Operation[]>

  getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<Token[]>

  getRounds(filter: RoundFilter): Promise<Round[]>

  getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<Collection[]>

  getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<TokenAccount[]>

  getNftTags(pagination: QueryPagination, search?: string): Promise<Tag[]>

  getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<ScResult[]>

  getAccountScResults(address: string, pagination: QueryPagination): Promise<ScResult[]>

  getAccounts(queryPagination: QueryPagination): Promise<Account[]>

  getAccountContracts(pagination: QueryPagination, address: string): Promise<ScDeploy[]>

  getAccountHistory(address: string, pagination: QueryPagination): Promise<AccountHistory[]>

  getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<AccountTokenHistory[]>

  getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<Transaction[]>

  getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<Token[]>

  getTransactionLogs(hashes: string[]): Promise<TransactionLog[]>

  getTransactionScResults(txHash: string): Promise<ScResult[]>

  getScResultsForTransactions(elasticTransactions: Transaction[]): Promise<ScResult[]>

  getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<TokenAccount[]>

  getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<TokenAccount[]>

  getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<TokenAccount[]>

  getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<Transaction[]>

  getTransactionReceipts(txHash: string): Promise<TransactionReceipt[]>

  getAllTokensMetadata(action: (items: Token[]) => Promise<void>): Promise<void>

  getEsdtAccountsCount(identifier: string): Promise<number>

  getAllAccountsWithToken(identifier: string, action: (items: TokenAccount[]) => Promise<void>): Promise<void>

  getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined>

  getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number }[]>

  getAssetsForToken(identifier: string): Promise<TokenAssets>

  setAssetsForToken(identifier: string, value: TokenAssets): Promise<void>

  setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void>

  setMediaForToken(identifier: string, value: NftMedia[]): Promise<void>

  setMetadataForToken(identifier: string, value: any): Promise<void>
}
