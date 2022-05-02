import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { AbstractQuery } from "src/common/elastic/entities/abstract.query";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApiUtils } from "src/utils/api.utils";
import { SmartContractResult } from "./entities/smart.contract.result";
import { SmartContractResultFilter } from "./entities/smart.contract.result.filter";

@Injectable()
export class SmartContractResultService {
  constructor(
    private readonly elasticService: ElasticService,
    private readonly apiConfigService: ApiConfigService,
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

    return elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
  }

  async getScResult(scHash: string): Promise<SmartContractResult | undefined> {
    const scResult = await this.elasticService.getItem('scresults', 'hash', scHash);
    if (!scResult) {
      return undefined;
    }

    return ApiUtils.mergeObjects(new SmartContractResult(), scResult);
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

    return elasticResult.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
  }

  async getAccountScResultsCount(address: string): Promise<number> {
    const elasticQuery: ElasticQuery = this.buildSmartContractResultFilterQuery(address);

    return await this.elasticService.getCount('scresults', elasticQuery);
  }
}
