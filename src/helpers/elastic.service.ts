import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { NftFilter } from "src/endpoints/tokens/entities/nft.filter";
import { NftType } from "src/endpoints/tokens/entities/nft.type";
import { TransactionLog } from "src/endpoints/transactions/entities/transaction.log";
import { ApiConfigService } from "./api.config.service";
import { ApiService } from "./api.service";
import { buildElasticQuery } from "./elastic.queries";
import { ElasticQuery } from "./entities/elastic/elastic.query";
import { ElasticSortOrder } from "./entities/elastic/elastic.sort.order";
import { QueryOperator } from "./entities/elastic/query.operator";
import { QueryType } from "./entities/elastic/query.type";
import { PerformanceProfiler } from "./performance.profiler";

@Injectable()
export class ElasticService {
  private readonly url: string;

  constructor(
    private apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
    private readonly apiService: ApiService
  ) {
    this.url = apiConfigService.getElasticUrl();
  }

  async getCount(collection: string, elasticQueryAdapter: ElasticQuery | undefined = undefined) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;

    let elasticQuery;

    if (elasticQueryAdapter) {
      elasticQuery = buildElasticQuery(elasticQueryAdapter)
    }
 
    const result: any = await this.post(url, elasticQuery);
    let count = result.data.count;

    return count;
  };

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.url}/${collection}/_doc/${identifier}`;
    const { data: document } = await this.get(url);

    return this.formatItem(document, key);
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

    const {
      data: {
        hits: { hits: documents },
      },
    } = await this.post(url, elasticQuery);
  
    return documents.map((document: any) => this.formatItem(document, key));
  };

  async getAccountEsdtByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.must = [
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokensByIdentifiers(identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition.should = identifiers.map(identifier => 
      QueryType.Match('identifier', identifier, QueryOperator.AND)
    );

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddress(address: string, from: number, size: number, token: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address, undefined),
      QueryType.Exists('identifier', undefined, undefined),
    ]

    if (token) {
      elasticQueryAdapter.condition.must.push(
        QueryType.Match('token', token, QueryOperator.AND)
      );
    }

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddressAndIdentifier(address: string, identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 1 };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address, undefined),
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getAccountEsdtByAddressCount(address: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 0 };

    elasticQueryAdapter.condition.must = [
      QueryType.Match('address', address, undefined),
      QueryType.Exists('identifier', undefined, undefined),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    return await this.getDocumentCount(url, elasticQuery);
  }

  private buildElasticNftFilter(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }]

    let queries = [];
    queries.push(QueryType.Exists('identifier', undefined, undefined));

    if (filter.search !== undefined) {
      queries.push(QueryType.Wildcard('token', `*${filter.search}*`, undefined));
    }

    if (filter.type !== undefined) {
      queries.push(QueryType.Match('type', filter.type, undefined));
    }

    if (identifier !== undefined) {
      queries.push(QueryType.Match('identifier', identifier, QueryOperator.AND));
    }

    if (filter.collection !== undefined) {
      queries.push(QueryType.Match('token', filter.collection, QueryOperator.AND));
    }

    if (filter.tags) {
      let tagArray = filter.tags.split(',');
      if (tagArray.length > 0) {
        for (let tag of tagArray) {
          queries.push(QueryType.Nested("metaData.attributes", { "metaData.attributes.tags": tag }, undefined));
        }
      }
    }

    if (filter.creator !== undefined) {
      queries.push(QueryType.Nested("metaData", { "metaData.creator": filter.creator }, undefined));
    }

    elasticQueryAdapter.condition.must = queries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return elasticQuery;
  }

  async getTokens(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    let query = await this.buildElasticNftFilter(from, size, filter, identifier);

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, query);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenCollectionCount(search: string | undefined, type: NftType | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 0 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }]
    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier', undefined, undefined));

    elasticQueryAdapter.condition.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${search}*`, undefined));
    }

    if (type !== undefined) {
      mustQueries.push(QueryType.Match('type', type, undefined));
    }
    elasticQueryAdapter.condition.must = mustQueries;

    let shouldQueries = [];
    shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT, undefined));
    shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT, undefined));
    elasticQueryAdapter.condition.should = shouldQueries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/tokens/_search`;
    return await this.getDocumentCount(url, elasticQuery);
  }

  async getTokenCollections(from: number, size: number, search: string | undefined, type: NftType | undefined, token: string | undefined, issuer: string | undefined, identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    let mustNotQueries = [];
    mustNotQueries.push(QueryType.Exists('identifier', undefined, undefined));
    elasticQueryAdapter.condition.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(QueryType.Wildcard('token', `*${search}*`, undefined));
    }

    if (type !== undefined) {
      mustQueries.push(QueryType.Match('type', type, undefined));
    }

    if (token !== undefined) {
      mustQueries.push(QueryType.Match('token', token, QueryOperator.AND));
    }

    if (issuer !== undefined) {
      mustQueries.push(QueryType.Match('issuer', issuer, undefined));
    }
    elasticQueryAdapter.condition.must = mustQueries;

    let shouldQueries = [];

    if (identifiers.length > 0) {
      for (let identifier of identifiers) {
        shouldQueries.push(QueryType.Match('token', identifier, QueryOperator.AND));
      }
    } else {
      shouldQueries.push(QueryType.Match('type', NftType.SemiFungibleESDT, undefined));
      shouldQueries.push(QueryType.Match('type', NftType.NonFungibleESDT, undefined));
    }
    elasticQueryAdapter.condition.should = shouldQueries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 1 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    elasticQueryAdapter.condition.must = [
      QueryType.Exists('identifier', undefined, undefined),
      QueryType.Match('identifier', identifier, QueryOperator.AND),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getTokenCount(filter: NftFilter): Promise<number> {
    let query = await this.buildElasticNftFilter(0, 0, filter, undefined);

    let url = `${this.url}/tokens/_search`;
    return await this.getDocumentCount(url, query);
  }

  async getLogsForTransactionHashes(hashes: string[]): Promise<TransactionLog[]> {
    let query = await this.buildLogsQuery(hashes);

    let url = `${this.url}/logs/_search`;
    return await this.getDocuments(url, query);
  }

  private buildLogsQuery(hashes: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from: 0, size: 100 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    let queries = [];
    for (let hash of hashes) {
      queries.push(QueryType.Match('_id', hash, undefined));
    }
    elasticQueryAdapter.condition.should = queries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return elasticQuery;
  }

  public async get(url: string) {
    let profiler = new PerformanceProfiler();
    let result = await this.apiService.get(url);
    profiler.stop();

    this.metricsService.setExternalCall('elastic', profiler.duration);

    return result;
  }

  private async post(url: string, body: any) {
    let profiler = new PerformanceProfiler();
    let result = await this.apiService.post(url, body);
    profiler.stop();

    this.metricsService.setExternalCall('elastic', profiler.duration);

    return result;
  }

  private async getDocuments(url: string, body: any) {
    const {
      data: {
        hits: { hits: documents },
      },
    } = await this.post(url, body);

    return documents;
  }

  private async getDocumentCount(url: string, body: any) {
    const {
      data: {
        hits: {
          total: {
            value
          }
        }
      }
    } = await this.post(url, body);

    return value;
  }
}