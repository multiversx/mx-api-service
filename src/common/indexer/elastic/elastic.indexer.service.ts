import { HttpStatus, Injectable } from "@nestjs/common";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { ElasticService, ElasticQuery, QueryOperator, QueryType, QueryConditionOptions, ElasticSortOrder, ElasticSortProperty, TermsQuery, RangeGreaterThanOrEqual, MatchQuery } from "@multiversx/sdk-nestjs-elastic";
import { IndexerInterface } from "../indexer.interface";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";
import { QueryPagination } from "src/common/entities/query.pagination";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { BlockFilter } from "src/endpoints/blocks/entities/block.filter";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { SortOrder } from "src/common/entities/sort.order";
import { TokenWithRolesFilter } from "src/endpoints/tokens/entities/token.with.roles.filter";
import { RoundFilter } from "src/endpoints/rounds/entities/round.filter";
import { SmartContractResultFilter } from "src/endpoints/sc-results/entities/smart.contract.result.filter";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { Block } from "../entities/block";
import { Tag } from "../entities/tag";
import { ElasticIndexerHelper } from "./elastic.indexer.helper";
import { TokenType } from "../entities";
import { SortCollections } from "src/endpoints/collections/entities/sort.collections";
import { AccountQueryOptions } from "src/endpoints/accounts/entities/account.query.options";
import { AccountSort } from "src/endpoints/accounts/entities/account.sort";
import { MiniBlockFilter } from "src/endpoints/miniblocks/entities/mini.block.filter";
import { AccountHistoryFilter } from "src/endpoints/accounts/entities/account.history.filter";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { NotWritableError } from "../entities/not.writable.error";


@Injectable()
export class ElasticIndexerService implements IndexerInterface {
  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly elasticService: ElasticService,
    private readonly indexerHelper: ElasticIndexerHelper,
    private readonly apiService: ApiService,
  ) { }

  async getAccountsCount(filter: AccountQueryOptions): Promise<number> {
    const query = this.indexerHelper.buildAccountFilterQuery(filter);

    return await this.elasticService.getCount('accounts', query);
  }

  async getScResultsCount(filter: SmartContractResultFilter): Promise<number> {
    const query = this.indexerHelper.buildResultsFilterQuery(filter);
    return await this.elasticService.getCount('scresults', query);
  }

  async getAccountContractsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("deployer", address)]);

    return await this.elasticService.getCount('scdeploys', elasticQuery);
  }

  async getBlocksCount(filter: BlockFilter): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, await this.indexerHelper.buildElasticBlocksFilter(filter));

    return await this.elasticService.getCount('blocks', elasticQuery);
  }

  async getBlocks(filter: BlockFilter, queryPagination: QueryPagination): Promise<Block[]> {
    const order = filter.order === SortOrder.asc ? ElasticSortOrder.ascending : ElasticSortOrder.descending;

    let elasticQuery = ElasticQuery.create()
      .withPagination(queryPagination)
      .withCondition(QueryConditionOptions.must, await this.indexerHelper.buildElasticBlocksFilter(filter));

    elasticQuery = elasticQuery.withSort([
      { name: "timestamp", order: order },
      { name: "shardId", order: ElasticSortOrder.ascending },
    ]);

    const result = await this.elasticService.getList('blocks', 'hash', elasticQuery);
    return result;
  }

  async getNftCollectionCount(filter: CollectionFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildCollectionRolesFilter(filter);
    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftCountForAddress(address: string, filter: NftFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildElasticNftFilter(filter, undefined, address);
    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }

  async getCollectionCountForAddress(address: string, filter: CollectionFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildCollectionRolesFilter(filter, address);
    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftCount(filter: NftFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildElasticNftFilter(filter);
    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftOwnersCount(identifier: string): Promise<number> {
    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withCondition(QueryConditionOptions.must, [QueryType.Match('identifier', identifier, QueryOperator.AND)]);

    return await this.elasticService.getCount('accountsesdt', elasticQuery);
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildTransferFilterQuery(filter);
    return await this.elasticService.getCount('operations', elasticQuery);
  }

  async getTokenCountForAddress(address: string, filter: TokenFilter): Promise<number> {
    let query = ElasticQuery.create()
      .withMustCondition(QueryType.Match('address', address));

    query = this.buildTokenFilter(query, filter);

    return await this.elasticService.getCount('accountsesdt', query);
  }

  async getTokensForAddress(address: string, queryPagination: QueryPagination, filter: TokenFilter): Promise<any[]> {
    let query = ElasticQuery.create()
      .withMustCondition(QueryType.Match('address', address))
      .withPagination({ from: queryPagination.from, size: queryPagination.size });

    query = this.buildTokenFilter(query, filter);

    return await this.elasticService.getList('accountsesdt', 'token', query);
  }

  async getTokenAccountsCount(identifier: string): Promise<number | undefined> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)]);

    const count = await this.elasticService.getCount("accountsesdt", elasticQuery);
    return count;
  }

  async getTokenAccounts(pagination: QueryPagination, identifier: string): Promise<any[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: "balanceNum", order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')]);

    return await this.elasticService.getList("accountsesdt", identifier, elasticQuery);
  }

  async getTokensWithRolesForAddressCount(address: string, filter: TokenWithRolesFilter): Promise<number> {
    const elasticQuery = this.indexerHelper.buildTokensWithRolesForAddressQuery(address, filter);
    return await this.elasticService.getCount('tokens', elasticQuery);
  }

  async getNftTagCount(search?: string): Promise<number> {
    const query = ElasticQuery.create()
      .withSearchWildcardCondition(search, ['tag']);

    return await this.elasticService.getCount('tags', query);
  }

  async getRoundCount(filter: RoundFilter): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, await this.indexerHelper.buildElasticRoundsFilter(filter));

    return await this.elasticService.getCount('rounds', elasticQuery);
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildSmartContractResultFilterQuery(address);
    return await this.elasticService.getCount('scresults', elasticQuery);
  }

  async getTransactionCountForAddress(address: string): Promise<number> {
    const queries = [
      QueryType.Match('sender', address),
      QueryType.Match('receiver', address),
    ];
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    const elasticQuery = this.indexerHelper.buildTransactionFilterQuery(filter, address);
    return await this.elasticService.getCount('transactions', elasticQuery);
  }

  async getRound(shard: number, round: number): Promise<any> {
    return await this.elasticService.getItem('rounds', 'round', `${shard}_${round}`);
  }

  async getToken(identifier: string): Promise<any> {
    return await this.elasticService.getItem('tokens', 'identifier', identifier);
  }

  async getCollection(identifier: string): Promise<any> {
    return await this.elasticService.getItem('tokens', '_id', identifier);
  }

  async getVersion(): Promise<string | undefined> {
    const query = ElasticQuery.create()
      .withMustMatchCondition('key', 'indexer-version');

    const result = await this.elasticService.getList('values', '_search', query);

    if (result && result.length > 0) {
      return result[0].value;
    } else {
      return undefined;
    }
  }

  async getTransaction(txHash: string): Promise<any> {
    const transaction = await this.elasticService.getItem('transactions', 'txHash', txHash);

    this.processTransaction(transaction);

    return transaction;
  }

  async getScDeploy(address: string): Promise<any> {
    return await this.elasticService.getItem('scdeploys', '_id', address);
  }

  async getScResult(scHash: string): Promise<any> {
    const result = await this.elasticService.getItem('scresults', 'hash', scHash);

    this.processTransaction(result);

    return result;
  }

  async getBlock(hash: string): Promise<Block> {
    return await this.elasticService.getItem('blocks', 'hash', hash);
  }

  async getMiniBlock(miniBlockHash: string): Promise<any> {
    return await this.elasticService.getItem('miniblocks', 'miniBlockHash', miniBlockHash);
  }

  async getTag(tag: string): Promise<Tag> {
    return await this.elasticService.getItem('tags', 'tag', BinaryUtils.base64Encode(tag));
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination): Promise<any[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.indexerHelper.buildTransferFilterQuery(filter)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    const elasticOperations = await this.elasticService.getList('operations', 'txHash', elasticQuery);

    for (const operation of elasticOperations) {
      this.processTransaction(operation);
    }

    return elasticOperations;
  }

  async getTokensWithRolesForAddress(address: string, filter: TokenWithRolesFilter, pagination: QueryPagination): Promise<any[]> {
    const elasticQuery = this.indexerHelper.buildTokensWithRolesForAddressQuery(address, filter, pagination);
    const tokenList = await this.elasticService.getList('tokens', 'identifier', elasticQuery);
    return tokenList;
  }

  async getRounds(filter: RoundFilter): Promise<any[]> {
    const { from, size } = filter;

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(filter.condition ?? QueryConditionOptions.must, await this.indexerHelper.buildElasticRoundsFilter(filter));

    return await this.elasticService.getList('rounds', 'round', elasticQuery);
  }

  async getNftCollections(pagination: QueryPagination, filter: CollectionFilter, address?: string): Promise<any[]> {
    let elasticQuery = this.indexerHelper.buildCollectionRolesFilter(filter, address)
      .withPagination(pagination);

    const sort = filter.sort ?? SortCollections.timestamp;
    const order = filter.order === SortOrder.asc ? ElasticSortOrder.ascending : ElasticSortOrder.descending;

    if (sort === SortCollections.verifiedAndHolderCount) {
      elasticQuery = elasticQuery.withSort([
        { name: 'api_isVerified', order },
        { name: 'api_holderCount', order },
      ]);
    } else {
      elasticQuery = elasticQuery.withSort([
        { name: 'timestamp', order },
      ]);
    }

    return await this.elasticService.getList('tokens', 'identifier', elasticQuery);
  }

  async getNftCollectionsByIds(identifiers: string[]): Promise<any[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: identifiers.length + 1 })
      .withMustNotExistCondition('identifier')
      .withMustMultiShouldCondition(identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND));

    return await this.elasticService.getList('tokens', 'identifier', elasticQuery);
  }

  async getSmartContractResults(transactionHashes: string[]): Promise<any[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: transactionHashes.length + 1 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
      .withTerms(new TermsQuery('originalTxHash', transactionHashes));

    return await this.elasticService.getList('scresults', 'scHash', elasticQuery);
  }

  async getAccountsForAddresses(addresses: string[]): Promise<any[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: addresses.length + 1 })
      .withTerms(new TermsQuery('address', addresses));

    return await this.elasticService.getList('accounts', 'address', elasticQuery);
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    const queries = [];

    for (const address of addresses) {
      queries.push(QueryType.Match('address', address));
    }

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: addresses.length })
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match("address", "pending")])
      .withCondition(QueryConditionOptions.must, [QueryType.Match('token', identifier, QueryOperator.AND)])
      .withRangeFilter("balanceNum", new RangeGreaterThanOrEqual(0))
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);
  }

  async getNftTags(pagination: QueryPagination, search?: string): Promise<any[]> {
    const elasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSearchWildcardCondition(search, ['tag'])
      .withSort([{ name: 'count', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('tags', 'tag', elasticQuery);
  }

  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<any[]> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildResultsFilterQuery(filter)
      .withPagination(pagination);

    const results = await this.elasticService.getList('scresults', 'hash', elasticQuery);

    for (const result of results) {
      this.processTransaction(result);
    }

    return results;
  }

  async getMiniBlocks(pagination: QueryPagination, filter: MiniBlockFilter): Promise<any[]> {
    let query = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    if (filter.hashes) {
      query = query.withShouldCondition(filter.hashes.map(hash => QueryType.Match('_id', hash)));
    }

    if (filter.type) {
      query = query.withCondition(QueryConditionOptions.must, [QueryType.Match("type", filter.type)]);
    }

    return await this.elasticService.getList('miniblocks', 'miniBlockHash', query);
  }

  async getAccountScResults(address: string, pagination: QueryPagination): Promise<any[]> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildSmartContractResultFilterQuery(address)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('scresults', 'hash', elasticQuery);
  }

  async getAccounts(queryPagination: QueryPagination, filter: AccountQueryOptions): Promise<any[]> {
    let elasticQuery = this.indexerHelper.buildAccountFilterQuery(filter);
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;
    const sort: AccountSort = filter.sort ?? AccountSort.balance;

    switch (sort) {
      case AccountSort.balance:
        elasticQuery = elasticQuery.withSort([{ name: 'balanceNum', order: sortOrder }]);
        break;
      case AccountSort.transfersLast24h:
        if (this.apiConfigService.getAccountExtraDetailsTransfersLast24hUrl()) {
          elasticQuery = elasticQuery.withSort([{ name: 'api_transfersLast24h', order: sortOrder }]);
        } else {
          elasticQuery = elasticQuery
            .withSort([{ name: 'timestamp', order: sortOrder }])
            .withMustExistCondition('currentOwner');
        }
        break;
      default:
        elasticQuery = elasticQuery.withSort([{ name: sort.toString(), order: sortOrder }]);
        break;
    }

    elasticQuery = elasticQuery.withPagination(queryPagination);

    return await this.elasticService.getList('accounts', 'address', elasticQuery);
  }

  async getAccount(address: string): Promise<any> {
    return await this.elasticService.getItem(
      'accounts',
      'address',
      address
    );
  }

  async getAccountContracts(pagination: QueryPagination, address: string): Promise<any[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withCondition(QueryConditionOptions.must, [QueryType.Match("deployer", address)])
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('scdeploys', "contract", elasticQuery);
  }

  async getProviderDelegators(address: string, pagination: QueryPagination): Promise<any[]> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withCondition(QueryConditionOptions.must, [QueryType.Match("contract", address)])
      .withSort([{ name: 'activeStake', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList("delegators", "contract", elasticQuery);
  }

  async getProviderDelegatorsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("contract", address)]);

    return await this.elasticService.getCount('delegators', elasticQuery);
  }
  async getAccountHistory(address: string, pagination: QueryPagination, filter?: AccountHistoryFilter): Promise<any[]> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildAccountHistoryFilterQuery(address, undefined, filter)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('accountshistory', 'address', elasticQuery);
  }

  async getAccountTokenHistory(address: string, tokenIdentifier: string, pagination: QueryPagination, filter: AccountHistoryFilter): Promise<any[]> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildAccountHistoryFilterQuery(address, tokenIdentifier, filter)
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('accountsesdthistory', 'address', elasticQuery);
  }

  async getAccountHistoryCount(address: string, filter?: AccountHistoryFilter): Promise<number> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildAccountHistoryFilterQuery(address, undefined, filter);

    return await this.elasticService.getCount('accountshistory', elasticQuery);
  }

  async getAccountTokenHistoryCount(address: string, tokenIdentifier: string, filter?: AccountHistoryFilter): Promise<number> {
    const elasticQuery: ElasticQuery = this.indexerHelper.buildAccountHistoryFilterQuery(address, tokenIdentifier, filter);

    return await this.elasticService.getCount('accountsesdthistory', elasticQuery);
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, address?: string): Promise<any[]> {
    const sortOrder: ElasticSortOrder = !filter.order || filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending;

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: sortOrder };
    const nonce: ElasticSortProperty = { name: 'nonce', order: sortOrder };

    const elasticQuery = this.indexerHelper.buildTransactionFilterQuery(filter, address)
      .withPagination({ from: pagination.from, size: pagination.size })
      .withSort([timestamp, nonce]);

    const transactions = await this.elasticService.getList('transactions', 'txHash', elasticQuery);

    for (const transaction of transactions) {
      this.processTransaction(transaction);
    }

    return transactions;
  }

  private processTransaction(transaction: any) {
    if (transaction && !transaction.function) {
      transaction.function = transaction.operation;
    }
  }

  private buildTokenFilter(query: ElasticQuery, filter: TokenFilter): ElasticQuery {
    if (filter.includeMetaESDT === true) {
      query = query.withMustMultiShouldCondition([TokenType.FungibleESDT, TokenType.MetaESDT], type => QueryType.Match('type', type));
    } else {
      query = query.withMustNotCondition(QueryType.Exists('identifier'));
    }

    if (filter.type) {
      query = query.withMustMatchCondition('type', filter.type);
    }

    if (filter.identifier) {
      query = query.withMustCondition(QueryType.Match('token', filter.identifier));
    }

    if (filter.identifiers) {
      query = query.withShouldCondition(filter.identifiers.map(identifier => QueryType.Match('token', identifier)));
    }

    if (filter.name) {
      query = query.withMustCondition(QueryType.Nested('data.name', [new MatchQuery('data.name', filter.name)]));
    }

    if (filter.search) {
      query = query.withMustCondition(QueryType.Nested('data.name', [new MatchQuery('data.name', filter.name)]));
    }

    return query;
  }

  async getTransactionLogs(hashes: string[]): Promise<any[]> {
    const queries = [];
    for (const hash of hashes) {
      queries.push(QueryType.Match('_id', hash));
    }

    const elasticQueryLogs = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getList('logs', 'id', elasticQueryLogs);
  }

  async getTransactionScResults(txHash: string): Promise<any[]> {
    const originalTxHashQuery = QueryType.Match('originalTxHash', txHash);
    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.ascending };

    const elasticQuerySc = ElasticQuery.create()
      .withPagination({ from: 0, size: 100 })
      .withSort([timestamp])
      .withCondition(QueryConditionOptions.must, [originalTxHashQuery]);

    const results = await this.elasticService.getList('scresults', 'hash', elasticQuerySc);

    for (const result of results) {
      this.processTransaction(result);
    }

    return results;
  }

  async getScResultsForTransactions(elasticTransactions: any[]): Promise<any[]> {
    const hashes = elasticTransactions.filter(x => x.hasScResults === true).map(x => x.txHash);
    if (hashes.length === 0) {
      return [];
    }

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }])
      .withTerms(new TermsQuery('originalTxHash', hashes));

    return await this.elasticService.getList('scresults', 'scHash', elasticQuery);
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination) {
    if (identifiers.length === 0) {
      return [];
    }

    const queries = identifiers.map((identifier) => QueryType.Match('identifier', identifier, QueryOperator.AND));

    let elasticQuery = ElasticQuery.create();

    if (pagination) {
      elasticQuery = elasticQuery.withPagination(pagination);
    }

    elasticQuery = elasticQuery
      .withSort([{ name: "balanceNum", order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withCondition(QueryConditionOptions.should, queries)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);
  }

  async getAccountsEsdtByCollection(identifiers: string[], pagination?: QueryPagination) {
    if (identifiers.length === 0) {
      return [];
    }

    const queries = identifiers.map((identifier) => QueryType.Match('collection', identifier, QueryOperator.AND));

    let elasticQuery = ElasticQuery.create();

    if (pagination) {
      elasticQuery = elasticQuery.withPagination(pagination);
    }

    elasticQuery = elasticQuery
      .withSort([{ name: "balanceNum", order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withCondition(QueryConditionOptions.should, queries)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    return await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);
  }

  async getNftsForAddress(address: string, filter: NftFilter, pagination: QueryPagination): Promise<any[]> {
    let elasticQuery = this.indexerHelper.buildElasticNftFilter(filter, undefined, address)
      .withPagination(pagination);

    if (this.apiConfigService.getIsIndexerV3FlagActive()) {
      elasticQuery = elasticQuery.withSort([
        { name: 'timestamp', order: ElasticSortOrder.descending },
        { name: 'tokenNonce', order: ElasticSortOrder.descending },
      ]);
    } else {
      elasticQuery = elasticQuery.withSort([{ name: '_id', order: ElasticSortOrder.ascending }]);
    }

    return await this.elasticService.getList('accountsesdt', 'identifier', elasticQuery);
  }

  async getNfts(pagination: QueryPagination, filter: NftFilter, identifier?: string): Promise<any[]> {
    let elasticQuery = this.indexerHelper.buildElasticNftFilter(filter, identifier)
      .withPagination(pagination);

    if (filter.sort) {
      elasticQuery = elasticQuery.withSort([
        { name: filter.sort, order: filter.order === SortOrder.desc ? ElasticSortOrder.descending : ElasticSortOrder.ascending },
      ]);
    } else {
      elasticQuery = elasticQuery.withSort([
        { name: 'timestamp', order: ElasticSortOrder.descending },
        { name: 'nonce', order: ElasticSortOrder.descending },
      ]);
    }

    let elasticNfts = await this.elasticService.getList('tokens', 'identifier', elasticQuery);
    if (elasticNfts.length === 0 && identifier !== undefined) {
      elasticNfts = await this.elasticService.getList('accountsesdt', 'identifier', ElasticQuery.create().withMustMatchCondition('identifier', identifier, QueryOperator.AND));
    }
    return elasticNfts;
  }

  async getTransactionBySenderAndNonce(sender: string, nonce: number): Promise<any[]> {
    const queries = [
      QueryType.Match('sender', sender),
      QueryType.Match('nonce', nonce),
    ];

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withCondition(QueryConditionOptions.must, queries);

    return await this.elasticService.getList('transactions', 'txHash', elasticQuery);
  }

  async getTransactionReceipts(txHash: string): Promise<any[]> {
    const receiptHashQuery = QueryType.Match('txHash', txHash);
    const elasticQueryReceipts = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withCondition(QueryConditionOptions.must, [receiptHashQuery]);

    return await this.elasticService.getList('receipts', 'receiptHash', elasticQueryReceipts);
  }

  async getAllTokensMetadata(action: (items: any[]) => Promise<void>): Promise<void> {
    const query = ElasticQuery.create()
      .withFields([
        'api_isWhitelistedStorage',
        'api_media',
        'api_metadata',
        'data.uris',
      ])
      .withMustExistCondition('identifier')
      .withMustMultiShouldCondition([EsdtType.NonFungibleESDT, EsdtType.SemiFungibleESDT], type => QueryType.Match('type', type))
      .withPagination({ from: 0, size: 10000 });

    return await this.elasticService.getScrollableList('tokens', 'identifier', query, action);
  }

  async getEsdtAccountsCount(identifier: string): Promise<number> {
    const elasticQuery: ElasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, [QueryType.Match("token", identifier, QueryOperator.AND)]);

    const count = await this.elasticService.getCount("accountsesdt", elasticQuery);
    return count;
  }

  async getAllAccountsWithToken(identifier: string, action: (items: any[]) => Promise<void>): Promise<void> {
    const query = ElasticQuery.create()
      .withPagination({ from: 0, size: 10000 })
      .withMustMatchCondition('token', identifier, QueryOperator.AND);

    return await this.elasticService.getScrollableList('accountsesdt', 'id', query, action);
  }

  async getPublicKeys(shard: number, epoch: number): Promise<string[] | undefined> {
    const key = `${shard}_${epoch}`;

    const url = `${this.apiConfigService.getElasticUrl()}/validators/_search?q=_id:${key}`;

    const result = await this.elasticService.get(url);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const publicKeys = hits[0]._source.publicKeys;
      return publicKeys;
    }

    return undefined;
  }

  private indexerV5Active: boolean | undefined = undefined;

  async isIndexerV5Active(): Promise<boolean> {
    if (this.indexerV5Active !== undefined) {
      return this.indexerV5Active;
    }

    const mappingsResult = await this.apiService.get(`${this.apiConfigService.getElasticUrl()}/tokens/_mappings`);
    const mappings = mappingsResult.data?.tokens?.mappings?.properties ?? mappingsResult.data['tokens-000001']?.mappings?.properties;

    const currentOwnerType = mappings?.currentOwner?.type;

    this.indexerV5Active = currentOwnerType === 'keyword';
    return this.indexerV5Active;
  }

  async getCollectionsForAddress(
    address: string,
    filter: CollectionFilter,
    pagination: QueryPagination
  ): Promise<{ collection: string, count: number, balance: number }[]> {
    const types = [NftType.SemiFungibleESDT, NftType.NonFungibleESDT];
    if (!filter.excludeMetaESDT) {
      types.push(NftType.MetaESDT);
    }

    const isIndexerV5Active = await this.isIndexerV5Active();

    const elasticQuery = ElasticQuery.create()
      .withMustExistCondition('identifier')
      .withMustMatchCondition('address', address)
      .withPagination({ from: 0, size: 0 })
      .withMustMatchCondition('token', filter.collection, QueryOperator.AND)
      .withMustMultiShouldCondition(filter.identifiers, identifier => QueryType.Match('token', identifier, QueryOperator.AND))
      .withSearchWildcardCondition(filter.search, ['token', 'name'])
      .withMustMultiShouldCondition(filter.type, type => QueryType.Match('type', type))
      .withMustMultiShouldCondition(types, type => QueryType.Match('type', type))
      .withExtra({
        aggs: {
          collections: {
            composite: {
              size: 10000,
              sources: [
                {
                  collection: {
                    terms: {
                      field: isIndexerV5Active ? 'token' : 'token.keyword',
                    },
                  },
                },
              ],
            },
            aggs: {
              balance: {
                sum: {
                  field: 'balanceNum',
                },
              },
            },
          },
        },
      });

    const result = await this.elasticService.post(`${this.apiConfigService.getElasticUrl()}/accountsesdt/_search`, elasticQuery.toJson());

    const buckets = result?.data?.aggregations?.collections?.buckets;

    let data: { collection: string, count: number, balance: number }[] = buckets.map((bucket: any) => ({
      collection: bucket.key.collection,
      count: bucket.doc_count,
      balance: bucket.balance.value,
    }));

    data = data.slice(pagination.from, pagination.from + pagination.size);
    return data;
  }

  async getAssetsForToken(identifier: string): Promise<any> {
    return await this.elasticService.getCustomValue('tokens', identifier, 'assets');
  }

  async setAssetsForToken(identifier: string, value: any): Promise<void> {
    return await this.elasticService.setCustomValue('tokens', identifier, 'assets', value);
  }

  async setIsWhitelistedStorageForToken(identifier: string, value: boolean): Promise<void> {
    return await this.elasticService.setCustomValue('tokens', identifier, 'isWhitelistedStorage', value);
  }

  async setMediaForToken(identifier: string, value: any[]): Promise<void> {
    return await this.elasticService.setCustomValue('tokens', identifier, 'media', value);
  }

  async setMetadataForToken(identifier: string, value: any): Promise<void> {
    return await this.elasticService.setCustomValue('tokens', identifier, 'metadata', value);
  }

  async getEsdtProperties(identifier: string): Promise<any> {
    return await this.elasticService.getItem(
      'tokens',
      'identifier',
      identifier
    );
  }

  async getAllFungibleTokens(): Promise<any[]> {
    const query = ElasticQuery.create()
      .withMustMatchCondition('type', TokenType.FungibleESDT)
      .withFields(["name", "type", "currentOwner", "numDecimals", "properties", "timestamp"])
      .withMustNotExistCondition('identifier')
      .withPagination({ from: 0, size: 1000 });

    const allTokens: any[] = [];

    await this.elasticService.getScrollableList(
      'tokens',
      'identifier',
      query,
      // @ts-ignore
      // eslint-disable-next-line require-await
      async tokens => allTokens.push(...tokens),
    );

    return allTokens;
  }

  async setExtraCollectionFields(identifier: string, isVerified: boolean, holderCount: number, nftCount: number): Promise<void> {
    return await this.elasticService.setCustomValues('tokens', identifier, {
      isVerified,
      holderCount,
      nftCount,
    });
  }

  async setAccountAssetsFields(address: string, assets: AccountAssets): Promise<void> {
    return await this.elasticService.setCustomValues('accounts', address, { assets });
  }

  async ensureAccountsWritable(): Promise<void> {
    await this.ensureCollectionWritable('accounts');
  }

  async ensureTokensWritable(): Promise<void> {
    await this.ensureCollectionWritable('tokens');
  }

  private async ensureCollectionWritable(collection: string) {
    const query = new ElasticQuery().withPagination({ from: 0, size: 1 });
    const items = await this.elasticService.getList(collection, 'id', query);

    if (items.length === 0) {
      throw new Error(`No entries available in the '${collection}' collection`);
    }

    const item = items[0];

    try {
      await this.elasticService.setCustomValue(collection, item.id, 'ensureWritable', undefined);
    } catch (error) {
      // @ts-ignore
      if (error.status === HttpStatus.FORBIDDEN) {
        throw new NotWritableError(collection);
      }
    }
  }

  async setAccountTransfersLast24h(address: string, transfersLast24h: number): Promise<void> {
    return await this.elasticService.setCustomValues('accounts', address, {
      transfersLast24h,
    });
  }

  async getBlockByTimestampAndShardId(timestamp: number, shardId: number): Promise<Block | undefined> {
    const elasticQuery = ElasticQuery.create()
      .withRangeFilter('timestamp', new RangeGreaterThanOrEqual(timestamp))
      .withCondition(QueryConditionOptions.must, [QueryType.Match('shardId', shardId, QueryOperator.AND)])
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.ascending }]);

    const blocks: Block[] = await this.elasticService.getList('blocks', '_search', elasticQuery);

    return blocks.at(0);
  }
}
