import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import { Transaction } from 'src/endpoints/transactions/entities/transaction';
import request = require('supertest');

export class ApiChecker {
  skipFields: string[] = [];
  defaultParams: Record<string, any> = {};

  constructor(
    private readonly endpoint: string,
    private readonly httpServer: any,
  ) { }

  async checkPagination() {
    const items = await this.requestList({ size: 10000 });
    const paginationParams = [
      { from: 0, size: 1 },
      { from: 1, size: 5 },
      { from: 5, size: 5 },
      { from: 0, size: 10000 },
      { from: 9975, size: 25 },
    ];
    for (const params of paginationParams) {
      await this.checkPaginationInternal(items, params.from, params.size);
    }
  }

  async checkRateLimit() {
    const urlParams = new URLSearchParams({
      ...this.defaultParams,
    });
    try {
      const startTime = Date.now();
      const parallelRequests = Array.from({ length: 2 }, () => request(this.httpServer).get(`/${this.endpoint}?${urlParams}`));
      const responses = await Promise.all(parallelRequests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(responses[1].status).toBe(200);
      expect(duration).toBeLessThan(1000);
    } catch (error) {
      throw new Error("Exceed rate limit for parallel requests!");
    }
  }

  async checkPaginationError() {
    const items = await this.requestList({ size: 10000 });
    const paginationParams = [
      { from: 30, size: 9975 },
      { from: 9976, size: 25 },
      { from: 0, size: 10003 },
    ];
    for (const params of paginationParams) {
      await expect(this.checkPaginationInternal(items, params.from, params.size)).rejects.toThrowError(`Result window is too large, from + size must be less than or equal to: [10000] but was [${params.from + params.size}]`);
    }
  }

  private async checkPaginationInternal(allItems: any, from: number, size: number) {
    if ((from <= 9975) && (size <= 10000) && ((from + size) <= 10000)) {
      const items = await this.requestList({ from, size });
      expect(items).toEqual(allItems.slice(from, from + size));
    } else {
      throw new Error(`Result window is too large, from + size must be less than or equal to: [10000] but was [${from + size}]`);
    }
  }

  async checkWindowForTransactions(size: number) {
    if (size <= 50) {
      const result = await this.requestBody();
      expect(result).toBeInstanceOf(Array<Transaction>);
    } else {
      throw new Error('Complexity exceeded threshold 10000.');
    }
  }

  async checkArrayResponseBody() {
    const body = await this.requestBody();
    const code = await this.requestStatus();
    try {
      expect(code).toStrictEqual(200);
      expect(body).toBeInstanceOf(Array<Object>);
    } catch (error) {
      throw new Error("Invalid response body!");
    }
  }

  async checkObjectResponseBody() {
    const body = await this.requestBody();
    const code = await this.requestStatus();
    try {
      expect(code).toStrictEqual(200);
      expect(body).toBeInstanceOf(Object);
    } catch (error) {
      throw new Error("Invalid response body!");
    }
  }

  async checkDetails(field?: string) {
    const [item] = await this.requestList({ size: 1 });
    const idAttribute = field ? field : Object.keys(item)[0];
    const id = item[idAttribute];
    const details = await this.requestItemParallel(id, Object.keys(item));
    expect(details).toEqual(item);
  }

  async checkTokensDetails() {
    const [item] = await this.requestList({ size: 1 });
    const idAttribute = [item];
    const details = await this.requestItem(idAttribute[0].identifier, { fields: Object.keys(item).join(',') });
    // @ts-ignore
    delete details.circulatingSupply;
    delete details.supply;
    delete item.circulatingSupply;
    delete item.supply;
    expect(details).toEqual(item);
  }

  async checkAlternativeCount(params: Record<string, any> = {}) {
    const count = await this.requestCount(params);
    const alternativeCount = await this.requestAlternativeCount(params);
    try {
      expect(count).toStrictEqual(alternativeCount);
    } catch (error) {
      throw new Error(`Count value ${count} for '/count' is not equal with count value ${alternativeCount} of '/c' endpoint`);
    }
  }

  async checkFilter(criterias: string[]) {
    for (const criteria of criterias) {
      await this.checkFilterInternal(criteria);
    }
  }

  async checkFilterInternal(criteria: string) {
    const items = await this.requestList({ size: 100, fields: criteria });
    const distinctCriteria = items.map(x => x[criteria]).distinct();
    const shuffled = distinctCriteria.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);
    for (const value of selected) {
      await this.checkFilterValueInternal(criteria, value);
    }
  }

  async checkFilterValueInternal(criteria: string, value: string) {
    const items = await this.requestList({ size: 100, [criteria]: value, fields: criteria });
    const count = await this.requestCount({ [criteria]: value, fields: criteria });
    if (count < items.length) {
      const params: Record<string, any> = {
        size: 100,
        [criteria]: value,
      };
      const url = this.endpoint + '?' + new URLSearchParams(params);
      throw new Error(`Filter count for criteria '${criteria}' failed (length = ${items.length}, count = ${count}). request: '${url}'`);
    }
    const isValid = items.every(item => item[criteria] === value);
    if (isValid) {
      const params: Record<string, any> = {
        size: 1000,
        [criteria]: value,
      };
      const url = this.endpoint + '?' + new URLSearchParams(params);
      throw new Error(`Filter for criteria '${criteria}' failed. request: '${url}'`);
    }
  }

  async checkTypeCollections(criteria: string, value: string) {
    if ((value === 'NonFungibleESDT') || (value === 'SemiFungibleESDT') || (value === 'MetaESDT')) {
      const result = await this.requestType(criteria, value);
      expect(result).toBeInstanceOf(Array<NftCollection>);
    } else {
      throw new Error("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT).");
    }
  }

  async checkStatus() {
    const status = await this.requestStatus();
    try {
      expect(status).toStrictEqual(200);
    } catch (error) {
      throw new Error(`Endpoint status code ${status}`);
    }
  }

  private async requestBody(): Promise<any | any[]> {
    const result = await request(this.httpServer).get(`/${this.endpoint}`);
    return result.body;
  }

  private async requestList(params: Record<string, any>): Promise<any[]> {
    const allParams = {
      ...this.defaultParams,
      ...params,
    };
    const urlParams = new URLSearchParams(allParams);
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}?${urlParams}`);
    for (const item of result) {
      for (const skipField of this.skipFields) {
        delete item[skipField];
      }
    }
    return result;
  }

  private async requestItem(id: string, params: Record<string, any> = {}) {
    const urlParams = new URLSearchParams(params);
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}/${id}?${urlParams}`);
    for (const skipField of this.skipFields) {
      delete result[skipField];
    }
    return result;
  }

  private async requestItemParallel(id: string, fields: string[]) {
    const requests = fields.map(field => this.requestItem(id, { fields: field }));
    const responses = await Promise.all(requests);

    return responses.reduce((acc, response) => {
      return { ...acc, ...response };
    }, {});
  }

  private async requestCount(params: Record<string, any>): Promise<number> {
    const urlParams = new URLSearchParams({
      ...this.defaultParams,
      ...params,
    });
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}/count?${urlParams}`);
    return result;
  }

  private async requestAlternativeCount(params: Record<string, any>): Promise<number> {
    const urlParams = new URLSearchParams({
      ...this.defaultParams,
      ...params,
    });
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}/c?${urlParams}`);
    return result;
  }

  private async requestType(criteria: string, value: string): Promise<any[]> {
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}?${criteria}=${value}`);
    for (const item of result) {
      for (const skipField of this.skipFields) {
        delete item[skipField];
      }
    }
    return result;
  }

  private async requestStatus(): Promise<number> {
    const urlParams = new URLSearchParams({
      ...this.defaultParams,
    });
    const result = await request(this.httpServer).get(`/${this.endpoint}?${urlParams}`);
    return result.statusCode;
  }
}
