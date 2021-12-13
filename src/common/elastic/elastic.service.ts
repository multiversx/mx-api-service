import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { ApiService } from "../network/api.service";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { MetricsService } from "src/common/metrics/metrics.service";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { ApiConfigService } from "../api-config/api.config.service";
import { ElasticQuery } from "./entities/elastic.query";
import { QueryType } from "./entities/query.type";
import { QueryOperator } from "./entities/query.operator";
import { QueryConditionOptions } from "./entities/query.condition.options";
import { QueryPagination } from "../entities/query.pagination";
import { ElasticSortOrder } from "./entities/elastic.sort.order";
import { CollectionFilter } from "src/endpoints/collections/entities/collection.filter";

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

    let profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery?.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, profiler.duration);

    let count = result.data.count;

    return count;
  };

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.url}/${collection}/_search?q=_id:${identifier}`;
    let result = await this.get(url);

    let hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      let document = hits[0];

      return this.formatItem(document, key);
    }

    return undefined;
  };

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;

    return { ...item, ..._source };
  };

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    const url = `${overrideUrl ?? this.url}/${collection}/_search`;

    let profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, profiler.duration);

    let took = result.data.took;
    if (!isNaN(took)) {
      this.metricsService.setElasticTook(collection, took);
    }

    let documents = result.data.hits.hits;
    return documents.map((document: any) => this.formatItem(document, key));
  };

  async getAccountEsdtByIdentifier(identifier: string, pagination?: QueryPagination) {
    return this.getAccountEsdtByIdentifiers([identifier], pagination);
  }

  async getTokensByIdentifiers(identifiers: string[]) {
    const queries = identifiers.map(identifier =>
      QueryType.Match('identifier', identifier, QueryOperator.AND)
    );

    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.should, queries);

    let documents = await this.getDocuments('tokens', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByIdentifiers(identifiers: string[], pagination?: QueryPagination) {
    if (identifiers.length === 0) {
      return [];
    }

    const queries = identifiers.map((identifier) => QueryType.Match('identifier', identifier, QueryOperator.AND));

    let elasticQuery = ElasticQuery.create();

    if (pagination) {
      elasticQuery = elasticQuery.withPagination({ from: pagination.from, size: pagination.size });
    } else {
      elasticQuery = elasticQuery.withPagination({ from: 0, size: 100 });
    }

    elasticQuery = elasticQuery
      .withSort([{ name: "balanceNum", order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.mustNot, [QueryType.Match('address', 'pending')])
      .withCondition(QueryConditionOptions.should, queries);

    const documents = await this.getDocuments('accountsesdt', elasticQuery.toJson());

    let result = documents.map((document: any) => this.formatItem(document, 'identifier'));

    return result;
  }

  async getAccountEsdtByAddress(address: string, from: number, size: number, token: string | undefined) {
    const queries = [
      QueryType.Match('address', address),
      QueryType.Exists('identifier'),
    ]

    if (token) {
      queries.push(
        QueryType.Match('token', token, QueryOperator.AND)
      );
    }

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withCondition(QueryConditionOptions.must, queries);

    let documents = await this.getDocuments('accountsesdt', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddressAndIdentifier(address: string, identifier: string) {
    const queries = [
      QueryType.Match('address', address),
      QueryType.Match('token', identifier, QueryOperator.AND),
    ]

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withCondition(QueryConditionOptions.must, queries);

    let documents = await this.getDocuments('accountsesdt', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getAccountEsdtByAddressCount(address: string) {
    const queries = [
      QueryType.Match('address', address),
      QueryType.Exists('identifier'),
    ]

    const elasticQuery = ElasticQuery.create()
      .withCondition(QueryConditionOptions.must, queries);

    return await this.getDocumentCount('accountsesdt', elasticQuery.toJson());
  }

  private buildElasticNftFilter(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    let queries = [];
    queries.push(QueryType.Exists('identifier'));

    if (filter.search !== undefined) {
      queries.push(QueryType.Wildcard('token', `*${filter.search}*`));
    }

    if (filter.type !== undefined) {
      let types = filter.type.split(',');
      queries.push(QueryType.Should(types.map(type => QueryType.Match('type', type))));
    }

    if (identifier !== undefined) {
      queries.push(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (filter.collection !== undefined && filter.collection !== '') {
      queries.push(QueryType.Match('token', filter.collection, QueryOperator.AND));
    }

    if (filter.name !== undefined && filter.name !== '') {
      queries.push(QueryType.Nested('data', { "data.name": filter.name }));
    }

    if (filter.hasUris !== undefined) {
      queries.push(QueryType.Nested('data', { "data.nonEmptyURIs": filter.hasUris }));
    }

    if (filter.tags) {
      let tagArray = filter.tags.split(',');
      if (tagArray.length > 0) {
        for (let tag of tagArray) {
          queries.push(QueryType.Nested("data", { "data.tags": tag }));
        }
      }
    }

    if (filter.creator !== undefined) {
      queries.push(QueryType.Nested("data", { "data.creator": filter.creator }));
    }

    if (filter.identifiers) {
      let identifiers = filter.identifiers.split(',');
      queries.push(QueryType.Should(identifiers.map(identifier => QueryType.Match('identifier', identifier, QueryOperator.AND))));
    }

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from, size })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, queries);

    return elasticQuery;
  }

  async getTokens(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    let elasticQuery = await this.buildElasticNftFilter(from, size, filter, identifier);

    let documents = await this.getDocuments('tokens', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenCollectionCount(search: string | undefined, type: NftType | undefined) {
    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier'));

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${search}*`));
    }

    if (type !== undefined) {
      mustQueries.push(QueryType.Match('type', type));
    }

    let shouldQueries = [];
    shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT));
    shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT));
    shouldQueries.push(QueryType.Match('type', NftType.MetaESDT));

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 0 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, mustQueries)
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.mustNot, mustNotQueries);

    return await this.getDocumentCount('tokens', elasticQuery.toJson());
  }

  async getTokenCollections(pagination: QueryPagination, filter: CollectionFilter) {
    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier'));

    let mustQueries = [];
    if (filter.collection !== undefined) {
      mustQueries.push(QueryType.Match('token', filter.collection, QueryOperator.AND));
    }

    if (filter.identifiers !== undefined) {
      mustQueries.push(QueryType.Should(filter.identifiers.map(identifier => QueryType.Match('token', identifier, QueryOperator.AND))));
    }

    if (filter.search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${filter.search}*`));
    }

    if (filter.type !== undefined) {
      mustQueries.push(QueryType.Match('type', filter.type));
    }

    let shouldQueries = [];
    shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT));
    shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT));
    shouldQueries.push(QueryType.Match('type', NftType.MetaESDT));

    const elasticQuery = ElasticQuery.create()
      .withPagination(pagination)
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, mustQueries)
      .withCondition(QueryConditionOptions.should, shouldQueries)
      .withCondition(QueryConditionOptions.mustNot, mustNotQueries);

    let documents = await this.getDocuments('tokens', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenByIdentifier(identifier: string) {
    const queries = [
      QueryType.Exists('identifier'),
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withSort([{ name: 'timestamp', order: ElasticSortOrder.descending }])
      .withCondition(QueryConditionOptions.must, queries);

    let documents = await this.getDocuments('tokens', elasticQuery.toJson());

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getTokenCount(filter: NftFilter): Promise<number> {
    let query = await this.buildElasticNftFilter(0, 0, filter, undefined);

    return await this.getDocumentCount('tokens', query.toJson());
  }

  async getLogsForTransactionHashes(elasticQuery: ElasticQuery): Promise<TransactionLog[]> {
    return await this.getDocuments('logs', elasticQuery.toJson());
  }

  public async get(url: string) {
    return await this.apiService.get(url);
  }

  private async post(url: string, body: any) {
    return await this.apiService.post(url, body);
  }

  private async getDocuments(collection: string, body: any) {
    let profiler = new PerformanceProfiler();

    let result = await this.post(`${this.url}/${collection}/_search`, body);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, profiler.duration);

    let took = result.data.tookn;
    if (!isNaN(took)) {
      this.metricsService.setElasticTook(collection, took);
    }

    return result.data.hits.hits;
  }

  private async getDocumentCount(collection: string, body: any) {
    let profiler = new PerformanceProfiler();

    const {
      data: {
        hits: {
          total: {
            value
          }
        }
      }
    } = await this.post(`${this.url}/${collection}/_search`, body);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, profiler.duration);

    return value;
  }
}