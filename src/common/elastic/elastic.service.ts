import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { ApiService } from "../network/api.service";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ApiConfigService } from "../api-config/api.config.service";
import { ElasticQuery } from "./entities/elastic.query";
import { QueryType } from "./entities/query.type";
import { QueryOperator } from "./entities/query.operator";
import { QueryConditionOptions } from "./entities/query.condition.options";
import { QueryPagination } from "../entities/query.pagination";
import { ElasticSortOrder } from "./entities/elastic.sort.order";
import { ElasticMetricType } from "../metrics/entities/elastic.metric.type";
import { RangeQuery } from "./entities/range.query";

@Injectable()
export class ElasticService {
  private readonly url: string;

  constructor(
    private apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService
  ) {
    this.url = apiConfigService.getElasticUrl();
  }

  async getCount(collection: string, elasticQuery: ElasticQuery | undefined = undefined) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;

    const profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery?.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.count, profiler.duration);

    const count = result.data.count;

    return count;
  }

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.url}/${collection}/_search?q=_id:${identifier}`;

    const profiler = new PerformanceProfiler();

    const result = await this.get(url);

    profiler.stop();
    this.metricsService.setElasticDuration(collection, ElasticMetricType.item, profiler.duration);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const document = hits[0];

      return this.formatItem(document, key);
    }

    return undefined;
  }

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;

    return { ...item, ..._source };
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    const url = `${overrideUrl ?? this.url}/${collection}/_search`;

    const profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    return documents.map((document: any) => this.formatItem(document, key));
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void> {
    const url = `${this.url}/${collection}/_search?scroll=10m`;

    const profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    const scrollId = result.data._scroll_id;

    await action(documents.map((document: any) => this.formatItem(document, key)));

    while (true) {
      const scrollProfiler = new PerformanceProfiler();

      const scrollResult = await this.post(`${this.url}/_search/scroll`, {
        scroll: '20m',
        scroll_id: scrollId,
      });

      scrollProfiler.stop();
      this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

      const scrollDocuments = scrollResult.data.hits.hits;
      if (scrollDocuments.length === 0) {
        break;
      }

      await action(scrollDocuments.map((document: any) => this.formatItem(document, key)));
    }
  }

  async getAccountEsdtByIdentifier(identifier: string, pagination?: QueryPagination) {
    return await this.getAccountEsdtByIdentifiers([identifier], pagination);
  }

  async getAccountEsdtByAddressesAndIdentifier(identifier: string, addresses: string[]): Promise<any[]> {
    const queries = [];

    for (const address of addresses) {
      queries.push(QueryType.Match('address', address));
    }

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: addresses.length })
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match("address", "pending-")])
      .withCondition(QueryConditionOptions.must, [QueryType.Match('token', identifier, QueryOperator.AND)])
      .withFilter([new RangeQuery("balanceNum", undefined, 0)])
      .withCondition(QueryConditionOptions.should, queries);

    const documents = await this.getDocuments('accountsesdt', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
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

    const documents = await this.getDocuments('accountsesdt', elasticQuery.toJson());

    const result = documents.map((document: any) => this.formatItem(document, 'identifier'));

    return result;
  }

  async getAccountEsdtByAddressCount(address: string) {
    const queries = [
      QueryType.Match('address', address),
      QueryType.Exists('identifier'),
    ];

    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, queries);

    return await this.getDocumentCount('accountsesdt', elasticQuery.toJson());
  }

  async getLogsForTransactionHashes(elasticQuery: ElasticQuery): Promise<TransactionLog[]> {
    return await this.getDocuments('logs', elasticQuery.toJson());
  }

  public async get(url: string) {
    return await this.apiService.get(url);
  }

  public async post(url: string, body: any) {
    return await this.apiService.post(url, body);
  }

  private async getDocuments(collection: string, body: any) {
    const profiler = new PerformanceProfiler();

    const result = await this.post(`${this.url}/${collection}/_search`, body);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    return result.data.hits.hits;
  }

  private async getDocumentCount(collection: string, body: any) {
    const profiler = new PerformanceProfiler();

    const {
      data: {
        hits: {
          total: {
            value,
          },
        },
      },
    } = await this.post(`${this.url}/${collection}/_search`, body);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.count, profiler.duration);

    return value;
  }
}
