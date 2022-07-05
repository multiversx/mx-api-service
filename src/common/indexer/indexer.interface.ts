import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { QueryPagination } from "../entities/query.pagination";

export interface IndexerInterface {
  getAccountsCount(): Promise<number>

  getScResultsCount(): Promise<number>

  getAccountContractsCount(address: string): Promise<number>

  getBlocksCount(filter: BlockFilter): Promise<number>

  getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<any[]>

  getNftCollectionCount(filter: CollectionFilter): Promise<number>

  getNftCountForAddress(address: string, filter: NftFilter): Promise<number>

  getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number>

  getNftCount(filter: NftFilter): Promise<number>

  getNftOwnersCount(identifier: string): Promise<number>

  getTransfersCount(filter: TransactionFilter): Promise<number>

  getTokenCountForAddress(address: string): Promise<number>

  getTokenAccountsCount(identifier: string): Promise<number | undefined>

  getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<any[]>

  getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number>

  getNftTagCount(search?: string): Promise<number>

  getRoundCount(filter: RoundFilter): Promise<number>

  getAccountScResultsCount(address: string): Promise<number>

  getTransactionCountForAddress(address: string): Promise<number>

  getTransactionCount(filter: TransactionFilter, address?: string): Promise<number>

  getRound(shard: number, round: number): Promise<any>

  getToken(identifier: string): Promise<any>

  getCollection(identifier: string): Promise<any>

  getTransaction(txHash: string): Promise<any>

  getScDeploy(address: string): Promise<any>

  getScResult(scHash: string): Promise<any>

  getBlock(hash: string): Promise<any>

  getMiniBlock(miniBlockHash: string): Promise<any>

  getTag(tag: string): Promise<any>

  getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<any[]>

  getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<any[]>

  getRounds(filter: RoundFilter): Promise<any[]>

  getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<any[]>

  getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]>

  getNftTags(pagination: QueryPagination, search?: string): Promise<any[]>

  getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<any[]>

  getAccountScResults(address: string, pagination: QueryPagination): Promise<any[]>

  getAccounts(queryPagination: QueryPagination): Promise<any[]>

  getAccountContracts(pagination: QueryPagination, address: string): Promise<any[]>

  getAccountHistory(address: string, pagination: QueryPagination): Promise<any[]>

  getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination): Promise<any[]>

  getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<any[]>

  getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<any[]>

  getTransactionLogs(hashes: string[]): Promise<any[]>

  getTransactionScResults(txHash: string): Promise<any[]>

  getScResultsForTransactions(elasticTransactions: any[]): Promise<any[]>

  getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination): Promise<any[]>

  getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<any[]>

  getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<any[]>

  getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<any[]>

  getTransactionReceipts(txHash: string): Promise<any[]>

  getAllTokensMetadata(action: (items: any[]) => Promise<void>): Promise<void>

  getEsdtAccountsCount(identifier: string): Promise<number>

  getAllAccountsWithToken(identifier: string, action: (items: any[]) => Promise<void>): Promise<void>

  getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined>

  getCollectionsForAddress(address: string, filter: CollectionFilter, pagination: QueryPagination): Promise<{ collection: string, count: number, balance: number }[]>

  getAssetsForToken(identifier: string): Promise<any>

  setAssetsForToken(identifier: string, value: any): Promise<void>

  setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void>

  setMediaForToken(identifier: string, value: any[]): Promise<void>

  setMetadataForToken(identifier: string, value: any): Promise<void>
}
