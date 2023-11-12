import { Account } from 'src/endpoints/accounts/entities/account';
import { Block } from 'src/endpoints/blocks/entities/block';
import { NftCollection } from 'src/endpoints/collections/entities/nft.collection';
import { Nft } from 'src/endpoints/nfts/entities/nft';
import { Tag } from 'src/endpoints/nfttags/entities/tag';
import { Node } from 'src/endpoints/nodes/entities/node';
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
    const items = await this.requestList({ size: 100 });

    const paginationParams = [
      { from: 0, size: 1 },
      { from: 1, size: 5 },
      { from: 5, size: 5 },
      { from: 10, size: 20 },
    ];

    for (const params of paginationParams) {
      await this.checkPaginationInternal(items, params.from, params.size);
    }
  }

  async checkDetails(field?: string) {
    const [item] = await this.requestList({ size: 1 });
    const idAttribute = field ? field : Object.keys(item)[0];
    const id = item[idAttribute];
    const details = await this.requestItemParallel(id, Object.keys(item));
    expect(details).toEqual(item);
  }

  private async requestItemParallel(id: string, fields: string[]) {
    const requests = fields.map(field => this.requestItem(id, { fields: field }));
    const responses = await Promise.all(requests);

    return responses.reduce((acc, response) => {
      return { ...acc, ...response };
    }, {});
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

  async checkStatus() {
    const status = await this.requestStatus();
    try {
      expect(status).toStrictEqual(200);
    } catch (error) {
      throw new Error(`Endpoint status code ${status}`);
    }
  }

  async checkWindow(from?: number, size?: number) {
    const defaultFrom = 0;
    const defaultSize = 25;
    const effectiveFrom = from !== undefined ? from : defaultFrom;
    const effectiveSize = size !== undefined ? size : defaultSize;
    if ((effectiveFrom <= 9975) && (effectiveSize <= 10000) && ((effectiveFrom + effectiveSize) <= 10000)) {
      const result = await this.requestBody();
      expect(result).toBeInstanceOf(Array<any[]>);
    } else {
      throw new Error('Result window is too large!');
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

  async checkAccountsResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Account>);
    } catch (error) {
      throw new Error("Invalid response body for accounts!");
    }
  }

  async checkBlocksResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Block>);
    } catch (error) {
      throw new Error("Invalid response body for blocks!");
    }
  }

  async checkCollectionsResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<NftCollection>);
    } catch (error) {
      throw new Error("Invalid response body for collections!");
    }
  }

  async checkNftResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Nft>);
    } catch (error) {
      throw new Error("Invalid response body for nfts!");
    }
  }

  async checkNodesResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Node>);
    } catch (error) {
      throw new Error("Invalid response body for nodes!");
    }
  }

  async checkTagsResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Tag>);
    } catch (error) {
      throw new Error("Invalid response body for tags!");
    }
  }

  async checkTransactionsResponseBody() {
    const result = await this.requestBody();
    try {
      expect(result).toBeInstanceOf(Array<Transaction>);
    } catch (error) {
      throw new Error("Invalid response body for transactions!");
    }
  }

  async checkResponseBodyDefault() {
    const status = await this.requestBody();
    try {
      expect(status).toHaveLength(25);
    } catch (error) {
      throw new Error("Invalid response!");
    }
  }

  async checkType(criteria: string, value: string) {
    if ((value === 'NonFungibleESDT') || (value === 'SemiFungibleESDT') || (value === 'MetaESDT')) {
      const result = await this.requestType(criteria, value);
      expect(result).toBeInstanceOf(Array<NftCollection>);
    } else {
      throw new Error("Validation failed for argument 'type' (one of the following values is expected: NonFungibleESDT, SemiFungibleESDT, MetaESDT).");
    }
  }

  private async checkPaginationInternal(allItems: any, from: number, size: number) {
    const items = await this.requestList({ from, size });
    expect(items).toEqual(allItems.slice(from, from + size));
  }

  private async requestItem(id: string, params: Record<string, any> = {}) {
    const urlParams = new URLSearchParams(params);
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}/${id}?${urlParams}`);
    for (const skipField of this.skipFields) {
      delete result[skipField];
    }
    return result;
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

  private async requestType(criteria: string, value: string): Promise<any[]> {
    const { body: result } = await request(this.httpServer).get(`/${this.endpoint}?${criteria}=${value}`);
    for (const item of result) {
      for (const skipField of this.skipFields) {
        delete item[skipField];
      }
    }
    return result;
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

  private async requestStatus(): Promise<number> {
    const result = await request(this.httpServer).get(`/${this.endpoint}`);
    return result.statusCode;
  }

  private async requestBody(): Promise<any[]> {
    const result = await request(this.httpServer).get(`/${this.endpoint}`);
    return result.body;
  }
}
