import { AbstractQuery, ApiUtils, ElasticQuery, ElasticService, ElasticSortOrder, QueryConditionOptions, QueryType } from "@elrondnetwork/erdnest";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionType } from "../transactions/entities/transaction.type";
import { TransactionActionService } from "../transactions/transaction-action/transaction.action.service";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultFilter } from "./entities/smart.contract.result.filter";

@Injectable()
export class SmartContractResultService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => TransactionActionService))
    private readonly transactionActionService: TransactionActionService,
  ) { }

  private buildSmartContractResultFilterQuery(address?: string): ElasticQuery {
    const shouldQueries: AbstractQuery[] = [];
    const mustQueries: AbstractQuery[] = [];

    if (address) {
      shouldQueries.push(QueryType.Match('sender', address));
      shouldQueries.push(QueryType.Match('receiver', address));

      if (this.apiConfigService.getIsIndexerV3FlagActive()) {
        shouldQueries.push(QueryType.Match('receivers', address));
      }
    }

    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.must, mustQueries);

    return elasticQuery;
  }

  async getScResults(pagination: QueryPagination, filter: SmartContractResultFilter): Promise<SmartContractResult[]> {
    let query = ElasticQuery.create().withPagination(pagination);

    if (filter.miniBlockHash) {
      query = query.withCondition(QueryConditionOptions.must, [QueryType.Match('miniBlockHash', filter.miniBlockHash)]);
    }

    if (filter.originalTxHashes) {
      query = query.withShouldCondition(filter.originalTxHashes.map(originalTxHash => QueryType.Match('originalTxHash', originalTxHash)));
    }

    const elasticResult = await this.elasticService.getList('scresults', 'hash', query);

    const smartContractResults = elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));

    for (const smartContractResult of smartContractResults) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
      transaction.type = TransactionType.SmartContractResult;

      smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction);
    }

    return smartContractResults;
  }

  async getScResult(scHash: string): Promise<SmartContractResult | undefined> {
    const scResult = await this.elasticService.getItem('scresults', 'hash', scHash);
    if (!scResult) {
      return undefined;
    }

    const smartContractResult = ApiUtils.mergeObjects(new SmartContractResult(), scResult);
    const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
    transaction.type = TransactionType.SmartContractResult;

    smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction);

    return smartContractResult;
  }

  async getScResultsCount(): Promise<number> {
    return await this.elasticService.getCount('scresults', ElasticQuery.create());
  }

  async getAccountScResults(address: string, pagination: QueryPagination): Promise<SmartContractResult[]> {
    const elasticQuery: ElasticQuery = this.buildSmartContractResultFilterQuery(address);
    elasticQuery
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }]);

    const elasticResult = await this.elasticService.getList('scresults', 'hash', elasticQuery);

    const smartContractResults = elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));

    for (const smartContractResult of smartContractResults) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), smartContractResult);
      transaction.type = TransactionType.SmartContractResult;

      smartContractResult.action = await this.transactionActionService.getTransactionAction(transaction);
    }

    return smartContractResults;
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = this.buildSmartContractResultFilterQuery(address);

    return await this.elasticService.getCount('scresults', elasticQuery);
  }
}
