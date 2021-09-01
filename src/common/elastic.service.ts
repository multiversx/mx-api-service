import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { NftFilter } from "src/endpoints/tokens/entities/nft.filter";
import { NftType } from "src/endpoints/tokens/entities/nft.type";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { buildElasticQuery } from "../utils/elastic.queries";
import { ElasticQuery } from "./entities/elastic/elastic.query";
import { ElasticSortOrder } from "./entities/elastic/elastic.sort.order";
import { QueryOperator } from "./entities/elastic/query.operator";
import { QueryType } from "./entities/elastic/query.type";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { MetricsService } from "src/endpoints/metrics/metrics.service";

@Injectable()
export class ElasticService {
  private readonly url: string;

  constructor(
    private apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    private readonly metricsService: MetricsService
  ) {
    this.url = apiConfigService.getElasticUrl();
  }

  async getCount(collection: string, elasticQueryAdapter: ElasticQuery | undefined = undefined) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;

    let elasticQuery;

    if (elasticQueryAdapter) {
      elasticQuery = buildElasticQuery(elasticQueryAdapter)
    }
 
    let profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery);

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

  async getList(collection: string, key: string, elasticQueryAdapter: ElasticQuery): Promise<any[]> {
    const url = `${this.url}/${collection}/_search`;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, profiler.duration);

    let took = result.data.took;
    if (!isNaN(took)) {
      this.metricsService.setElasticTook(collection, took);
    }

    let documents = result.data.hits.hits;
    return documents.map((document: any) => this.formatItem(document, key));
  };

  async getAccountEsdtByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.must = [
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('accountsesdt', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokensByIdentifiers(identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.should = identifiers.map(identifier => 
      QueryType.Match('identifier', identifier, QueryOperator.AND)
    );

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('tokens', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddress(address: string, from: number, size: number, token: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address),
      QueryType.Exists('identifier'),
    ]

    if (token) {
      elasticQueryAdapter.condition.must.push(
        QueryType.Match('token', token, QueryOperator.AND)
      );
    }

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('accountsesdt', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddressAndIdentifier(address: string, identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 1 };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address),
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('accountsesdt', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getAccountEsdtByAddressCount(address: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 0 };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address),
      QueryType.Exists('identifier'),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return await this.getDocumentCount('accountsesdt', elasticQuery);
  }

  private buildElasticNftFilter(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descending }]

    let queries = [];
    queries.push(QueryType.Exists('identifier'));

    if (filter.search !== undefined) {
      queries.push(QueryType.Wildcard('token', `*${filter.search}*`));
    }

    if (filter.type !== undefined) {
      queries.push(QueryType.Match('type', filter.type));
    }

    if (identifier !== undefined) {
      queries.push(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (filter.collection !== undefined) {
      queries.push(QueryType.Match('token', filter.collection, QueryOperator.AND));
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

    elasticQueryAdapter.condition.must = queries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return elasticQuery;
  }

  async getTokens(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    let query = await this.buildElasticNftFilter(from, size, filter, identifier);

    let documents = await this.getDocuments('tokens', query);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenCollectionCount(search: string | undefined, type: NftType | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 0 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descending }];

    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier'));

    elasticQueryAdapter.condition.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${search}*`));
    }

    if (type !== undefined) {
      mustQueries.push(QueryType.Match('type', type));
    }
    elasticQueryAdapter.condition.must = mustQueries;

    let shouldQueries = [];
    shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT));
    shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT));
    elasticQueryAdapter.condition.should = shouldQueries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return await this.getDocumentCount('tokens', elasticQuery);
  }

  async getTokenCollections(from: number, size: number, search: string | undefined, type: NftType | undefined, token: string | undefined, issuer: string | undefined, identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descending }];

    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier'));
    elasticQueryAdapter.condition.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${search}*`));
    }

    if (type !== undefined) {
      mustQueries.push(QueryType.Match('type', type));
    }

    if (token !== undefined) {
      mustQueries.push(QueryType.Match('token', token, QueryOperator.AND));
    }

    if (issuer !== undefined) {
      mustQueries.push(QueryType.Match('issuer', issuer));
    }
    elasticQueryAdapter.condition.must = mustQueries;

    let shouldQueries = [];

    if (identifiers.length > 0) {
      for (let identifier of identifiers) {
        shouldQueries.push(QueryType.Match('token', identifier, QueryOperator.AND));
      }
    } else {
      shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT));
      shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT));
    }
    elasticQueryAdapter.condition.should = shouldQueries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('tokens', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 1 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descending }];

    elasticQueryAdapter.condition.must = [
      QueryType.Exists('identifier'),
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let documents = await this.getDocuments('tokens', elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getTokenCount(filter: NftFilter): Promise<number> {
    let query = await this.buildElasticNftFilter(0, 0, filter, undefined);

    return await this.getDocumentCount('tokens', query);
  }

  async getLogsForTransactionHashes(elasticQueryAdapter: ElasticQuery): Promise<TransactionLog[]> {
    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return await this.getDocuments('logs', elasticQuery);
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