import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { IndexerInterface } from "../indexer.interface";

@Injectable()
export class PostgresIndexerService implements IndexerInterface {
  constructor() { }

  getAccountsCount(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getScResultsCount(): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getAccountContractsCount(_address: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getBlocksCount(_filter: BlockFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getBlocks(_filter: BlockFilter, _queryPagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getNftCollectionCount(_filter: CollectionFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getNftCountForAddress(_address: string, _filter: NftFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getCollectionCountForAddress(_address: string, _filter: CollectionFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getNftCount(_filter: NftFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getNftOwnersCount(_identifier: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getTransfersCount(_filter: TransactionFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getTokenCountForAddress(_address: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getTokenAccountsCount(_identifier: string): Promise<number | undefined> {
    throw new Error("Method not implemented.");
  }
  getTokenAccounts(_pagination: QueryPagination, _identifier: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTokensWithRolesForAddressCount(_address: string, _filter: TokenWithRolesFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getNftTagCount(_search?: string | undefined): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getRoundCount(_filter: RoundFilter): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getAccountScResultsCount(_address: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getTransactionCountForAddress(_address: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getTransactionCount(_filter: TransactionFilter, _address?: string | undefined): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getRound(_shard: number, _round: number): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getToken(_identifier: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getCollection(_identifier: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getTransaction(_txHash: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getScDeploy(_address: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getScResult(_scHash: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getBlock(_hash: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getMiniBlock(_miniBlockHash: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getTag(_tag: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  getTransfers(_filter: TransactionFilter, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTokensWithRolesForAddress(_address: string, _filter: TokenWithRolesFilter, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getRounds(_filter: RoundFilter): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getNftCollections(_pagination: QueryPagination, _filter: CollectionFilter, _address?: string | undefined): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountEsdtByAddressesAndIdentifier(_identifier: string, _addresses: string[]): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getNftTags(_pagination: QueryPagination, _search?: string | undefined): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getScResults(_pagination: QueryPagination, _filter: SmartContractResultFilter): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountScResults(_address: string, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccounts(_queryPagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountContracts(_pagination: QueryPagination, _address: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountHistory(_address: string, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountTokenHistory(_address: string, _tokenIdentifier: string, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTransactions(_filter: TransactionFilter, _pagination: QueryPagination, _address?: string | undefined): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTokensForAddress(_address: string, _queryPagination: QueryPagination, _filter: TokenFilter): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTransactionLogs(_hashes: string[]): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTransactionScResults(_txHash: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getScResultsForTransactions(_elasticTransactions: any[]): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAccountEsdtByIdentifiers(_identifiers: string[], _pagination?: QueryPagination | undefined): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getNftsForAddress(_address: string, _filter: NftFilter, _pagination: QueryPagination): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getNfts(_pagination: QueryPagination, _filter: NftFilter, _identifier?: string | undefined): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTransactionBySenderAndNonce(_sender: string, _nonce: number): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getTransactionReceipts(_txHash: string): Promise<any[]> {
    throw new Error("Method not implemented.");
  }
  getAllTokensMetadata(_action: (items: any[]) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getEsdtAccountsCount(_identifier: string): Promise<number> {
    throw new Error("Method not implemented.");
  }
  getAllAccountsWithToken(_identifier: string, _action: (items: any[]) => Promise<void>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getPublicKeys(_shard: number, _epoch: number): Promise<string[] | undefined> {
    throw new Error("Method not implemented.");
  }
  getCollectionsForAddress(_address: string, _filter: CollectionFilter, _pagination: QueryPagination): Promise<{ collection: string; count: number; balance: number; }[]> {
    throw new Error("Method not implemented.");
  }
  getAssetsForToken(_identifier: string): Promise<any> {
    throw new Error("Method not implemented.");
  }
  setAssetsForToken(_identifier: string, _value: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setIsWhitelistedStorageForToken(_identifier: string, _value: boolean): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setMediaForToken(_identifier: string, _value: any[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setMetadataForToken(_identifier: string, _value: any): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
