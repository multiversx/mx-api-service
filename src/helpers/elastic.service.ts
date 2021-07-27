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
import { ExistsQuery } from "./entities/elastic/exists.query";
import { MatchQuery } from "./entities/elastic/match.query";
import { QueryCondition } from "./entities/elastic/query.condition";
import { QueryOperator } from "./entities/elastic/query.operator";
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

  publicKeysCache: any = {};

  public async getPublicKeys(shard: number, epoch: number) {
    const key = `${shard}_${epoch}`;
  
    if (this.publicKeysCache[key]) {
      return this.publicKeysCache[key];
    }
  
    const url = `${this.url}/validators/_doc/${key}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.get(url);
  
    this.publicKeysCache[key] = publicKeys;
  
    return publicKeys;
  };

  async getBlsIndex(bls: string, shardId: number, epoch: number): Promise<number | boolean> {
    const url = `${this.url}/validators/_doc/${shardId}_${epoch}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.get(url);
  
    const index = publicKeys.indexOf(bls);
  
    if (index !== -1) {
      return index;
    }
  
    return false;
  };

  async getBlses(shard: number, epoch: number) {
    const key = `${shard}_${epoch}`;
  
    const url = `${this.url}/validators/_doc/${key}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await this.get(url);
  
    return publicKeys;
  };

  private getNestedQuery(path: string, match: any) {
    return {
      nested: {
         path,
         query: {
            bool: {
               must: [
                  {
                     match
                  }
               ]
            }
         }
      }
   };
  }

  private getWildcardQuery(wildcard: any) {
    return { wildcard };
  }

  async getAccountEsdtByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter[elasticQueryAdapter.condition] = [
      new MatchQuery('identifier', identifier, QueryOperator.AND).getQuery(),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokensByIdentifiers(identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.should;
    elasticQueryAdapter[elasticQueryAdapter.condition] = identifiers.map(identifier => 
      new MatchQuery('identifier', identifier, QueryOperator.AND).getQuery()
    );

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddress(address: string, from: number, size: number, token: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter.pagination = { from, size };

    elasticQueryAdapter[elasticQueryAdapter.condition] = [
      new MatchQuery('address', address, undefined).getQuery(),
      new ExistsQuery('identifier', undefined, undefined).getQuery(),
    ]

    if (token) {
      elasticQueryAdapter[elasticQueryAdapter.condition].push(
        new MatchQuery('token', token, QueryOperator.AND).getQuery()
      );
    }

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getAccountEsdtByAddressAndIdentifier(address: string, identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter.pagination = { from: 0, size: 1 };

    elasticQueryAdapter[elasticQueryAdapter.condition] = [
      new MatchQuery('address', address, undefined).getQuery(),
      new MatchQuery('identifier', identifier, QueryOperator.AND).getQuery(),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    let documents = await this.getDocuments(url, elasticQuery);

    return documents.map((document: any) => this.formatItem(document, 'identifier'))[0];
  }

  async getAccountEsdtByAddressCount(address: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter.pagination = { from: 0, size: 0 };

    elasticQueryAdapter[elasticQueryAdapter.condition] = [
      new MatchQuery('address', address, undefined).getQuery(),
      new ExistsQuery('identifier', undefined, undefined).getQuery(),
    ]

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let url = `${this.url}/accountsesdt/_search`;
    return await this.getDocumentCount(url, elasticQuery);
  }

  private buildElasticNftFilter(from: number, size: number, filter: NftFilter, identifier: string | undefined) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }]

    let queries = [];
    queries.push(new ExistsQuery('identifier', undefined, undefined).getQuery());

    if (filter.search !== undefined) {
      queries.push(this.getWildcardQuery({ token: `*${filter.search}*` }));
    }

    if (filter.type !== undefined) {
      queries.push(new MatchQuery('type', filter.type, undefined).getQuery());
    }

    if (identifier !== undefined) {
      queries.push(new MatchQuery('identifier', identifier, QueryOperator.AND).getQuery());
    }

    if (filter.collection !== undefined) {
      queries.push(new MatchQuery('token', filter.collection, QueryOperator.AND).getQuery());
    }

    if (filter.tags) {
      let tagArray = filter.tags.split(',');
      if (tagArray.length > 0) {
        for (let tag of tagArray) {
          queries.push(this.getNestedQuery("metaData.attributes", { "metaData.attributes.tags": tag }));
        }
      }
    }

    if (filter.creator !== undefined) {
      queries.push(this.getNestedQuery("metaData", { "metaData.creator": filter.creator }));
    }

    elasticQueryAdapter[elasticQueryAdapter.condition] = queries;

    // const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let query = {
      sort: [
         {
            timestamp: {
               order: "desc"
            }
         }
      ],
      from,
      size,
      query: {
         bool: {
            must: queries
         }
      }
    };

    return query;
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
    mustNotQueries.push(new ExistsQuery('identifier', undefined, undefined).getQuery());

    elasticQueryAdapter.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(this.getWildcardQuery({ token: `*${search}*` }));
    }

    if (type !== undefined) {
      mustQueries.push(new MatchQuery('type', type, undefined).getQuery());
    }
    elasticQueryAdapter.must = mustQueries;

    let shouldQueries = [];
    shouldQueries.push(new MatchQuery('type', NftType.SemiFungibleESDT, undefined).getQuery());
    shouldQueries.push(new MatchQuery('type', NftType.NonFungibleESDT, undefined).getQuery());
    elasticQueryAdapter.should = shouldQueries;

    // const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let payload = {
      sort: [
         {
            timestamp: {
               order: "desc"
            }
         }
      ],
      from: 0,
      size: 0,
      query: {
         bool: {
            must_not: mustNotQueries,
            must: mustQueries,
            should: shouldQueries
         }
      }
    };

    let url = `${this.url}/tokens/_search`;
    return await this.getDocumentCount(url, payload);
  }

  async getTokenCollections(from: number, size: number, search: string | undefined, type: NftType | undefined, token: string | undefined, issuer: string | undefined, identifiers: string[]) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.pagination = { from, size };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    let mustNotQueries = [];
    mustNotQueries.push(new ExistsQuery('identifier', undefined, undefined).getQuery());
    elasticQueryAdapter.must_not = mustNotQueries;

    let mustQueries = [];
    if (search !== undefined) {
      mustQueries.push(this.getWildcardQuery({ token: `*${search}*` }));
    }

    if (type !== undefined) {
      mustQueries.push(new MatchQuery('type', type, undefined).getQuery());
    }

    if (token !== undefined) {
      mustQueries.push(new MatchQuery('token', token, QueryOperator.AND).getQuery());
    }

    if (issuer !== undefined) {
      mustQueries.push(new MatchQuery('issuer', issuer, undefined).getQuery());
    }
    elasticQueryAdapter.must = mustQueries;

    let shouldQueries = [];

    if (identifiers.length > 0) {
      for (let identifier of identifiers) {
        shouldQueries.push(new MatchQuery('token', identifier, QueryOperator.AND).getQuery());
      }
    } else {
      shouldQueries.push(new MatchQuery('type', NftType.SemiFungibleESDT, undefined).getQuery());
      shouldQueries.push(new MatchQuery('type', NftType.NonFungibleESDT, undefined).getQuery());
    }
    elasticQueryAdapter.should = shouldQueries;

    // const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    let payload = {
      sort: [
         {
            timestamp: {
               order: "desc"
            }
         }
      ],
      from,
      size,
      query: {
         bool: {
            must_not: mustNotQueries,
            must: mustQueries,
            should: shouldQueries
         }
      }
    };

    let url = `${this.url}/tokens/_search`;
    let documents = await this.getDocuments(url, payload);

    return documents.map((document: any) => this.formatItem(document, 'identifier'));
  }

  async getTokenByIdentifier(identifier: string) {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition = QueryCondition.must;
    elasticQueryAdapter.pagination = { from: 0, size: 1 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    elasticQueryAdapter[elasticQueryAdapter.condition] = [
      new ExistsQuery('identifier', undefined, undefined).getQuery(),
      new MatchQuery('identifier', identifier, QueryOperator.AND),
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
    elasticQueryAdapter.condition = QueryCondition.should;
    elasticQueryAdapter.pagination = { from: 0, size: 100 };
    elasticQueryAdapter.sort = [{ name: 'timestamp', order: ElasticSortOrder.descendant }];

    let queries = [];
    for (let hash of hashes) {
      queries.push(new MatchQuery('_id', hash, undefined).getQuery());
    }
    elasticQueryAdapter[elasticQueryAdapter.condition] = queries;

    const elasticQuery = buildElasticQuery(elasticQueryAdapter);

    return elasticQuery;
  }

  private async get(url: string) {
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