import { Injectable } from "@nestjs/common";
import axios from "axios";
import { ApiConfigService } from "./api.config.service";
import { ElasticPagination } from "./entities/elastic.pagination";

@Injectable()
export class ElasticService {
  constructor(private readonly apiConfigService: ApiConfigService) {}

  async getCount(collection: string, query = {}) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;
    query = this.buildQuery(query, 'should');
 
    const result: any = await axios.post(url, { query });
    let count = result.data.count;

    return count;
  };

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_doc/${identifier}`;
    const { data: document } = await axios.get(url);

    return this.formatItem(document, key);
  };

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;
  
    return { ...item, ..._source };
  };

  async getList(collection: string, key: string, query: any, pagination: ElasticPagination, sort: { [key: string]: string }, condition: string = 'must'): Promise<any[]> {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_search`;
    let elasticSort = this.buildSort(sort);
    let elasticQuery = this.buildQuery(query, condition);

    const {
      data: {
        hits: { hits: documents },
      },
    } = await axios.post(url, { query: elasticQuery, sort: elasticSort, from: pagination.from, size: pagination.size });
  
    return documents.map((document: any) => this.formatItem(document, key));
  };

  publicKeysCache: any = {};

  public async getPublicKeys(shard: number, epoch: number) {
    const key = `${shard}_${epoch}`;
  
    if (this.publicKeysCache[key]) {
      return this.publicKeysCache[key];
    }
  
    const url = `${this.apiConfigService.getElasticUrl()}/validators/_doc/${key}`;
  
    const {
      data: {
        _source: { publicKeys },
      },
    } = await axios.get(url);
  
    this.publicKeysCache[key] = publicKeys;
  
    return publicKeys;
  };

  private buildQuery(query: any = {}, operator: string = 'must') {
    delete query['from'];
    delete query['size'];

    const before = query['before'];
    const after = query['after'];

    delete query['before'];
    delete query['after'];
    const range: any = this.buildRange({ before, after });

    let result: any = null;

    if (Object.keys(query).length) {
      const must = Object.keys(query)
        .filter(key => query[key] !== null && query[key] !== undefined)
        .map((key) => {
        const match: any = {};

        const value = query[key];
        if (value !== null) {
          match[key] = query[key];
        }

        return { match };
      });

      let criteria: any = {};
      criteria[operator] = must;

      result = { bool: criteria };

      if (Object.keys(range['timestamp']).length != 0) {
        result.bool['filter'] = {
          range
        };
      }
    } 

    if (result === null) {
      result = { match_all: {} };
    }

    return result;
  };

  private buildSort(sort: any): any {
    return Object.keys(sort).map((key) => {
      const obj: any = {};

      obj[key] = {
        order: sort[key]
      };

      return obj;
    });
  };

  private buildRange(range: any = {}) {
    let obj: any = {};
    obj['timestamp'] = {};
    Object.keys(range).map((key) => {
      if (key == 'before' && range[key] != undefined) {
        obj['timestamp']['lte'] = range[key];
      }
      if (key == 'after' && range[key] != undefined) {
        obj['timestamp']['gte'] = range[key];
      }
    });
    return obj;
  };
}