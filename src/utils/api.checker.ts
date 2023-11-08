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

    //console.log('[item]:', [item]);
    const idAttribute = field ? field : Object.keys(item)[0];
    //console.log('idAttribute:', idAttribute);
    const id = item[idAttribute];
    //console.log('id', id);
    const details = await this.requestItemParallel(id, Object.keys(item));
    //console.log('details', details);
    expect(details).toEqual(item);
  }

  async checkAccountDetails(field?: string) {
    const [item] = await this.requestList({ size: 1 });

    //console.log('[item]:', item);
    const idAttribute = field ? field : Object.keys(item)[0];
    //console.log('idAttribute:', idAttribute);
    const id = idAttribute;
    //console.log('id', id);
    const details = await this.requestItemParallel(id, Object.keys(item));
    //console.log('details', details);
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
      throw new Error("Count value" + count + "for /count is not equal with count value " + alternativeCount + " of /c endpoint");
    }
  }

  async checkFilter(criterias: string[]) {
    for (const criteria of criterias) {
      await this.checkFilterInternal(criteria);
    }
  }

  async checkFilterInternal(criteria: string) {
    const items = await this.requestList({ size: 100, fields: criteria });

    //console.log('items: ', items);
    const distinctCriteria = items.map(x => x[criteria]).distinct();
    //console.log('distinctCriteria: ', distinctCriteria);
    const shuffled = distinctCriteria.sort(() => 0.5 - Math.random());
    //console.log('shuffled: ', shuffled);
    const selected = shuffled.slice(0, 10);
    //console.log('selected: ', selected);

    for (const value of selected) {
      await this.checkFilterValueInternal(criteria, value);
    }
  }

  async checkStatus() {
    const status = await this.requestStatus();

    try {
      expect(status).toStrictEqual(200);
    } catch (error) {
      throw new Error("Endpoint status code " + status);
    }
  }

  async checkAccountResponseBody() {
    const status = await this.requestBody();

    const expectedObj = [
      {
        address: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l',
        balance: expect.any(String),
        nonce: 1,
        timestamp: expect.any(Number),
        shard: 4294967295,
        ownerAddress: 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l',
        assets: {
          name: 'System: Staking Module',
          description: 'Smart contract containing all staked eGLD on the network',
          tags: [
            'system',
            'staking',
            'module'
          ],
          iconPng: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.png',
          iconSvg: 'https://raw.githubusercontent.com/multiversx/mx-assets/master/accounts/icons/multiversx.svg'
        }
      }
    ];

    try {
      expect(status).toEqual(expectedObj);
    } catch (error) {
      throw new Error("Bad Request!");
    }
  }

  async checkTagsResponseBody() {
    const status = await this.requestBody();

    const expectedObj = [
      {
        tag: "sunny",
        count: 1
      }
    ];

    try {
      expect(status).toEqual(expectedObj);
    } catch (error) {
      throw new Error("Bad Request!");
    }
  }

  async checkTotalCountOfAllBlocksResponseBody() {
    const status = await this.requestBodyCount();
    try {
      expect(+status).toBeGreaterThanOrEqual(68857158);
    } catch (error) {
      throw new Error("Bad Request!");
    }
  }

  async checkResponseBodyDefault() {
    const status = await this.requestBody();

    try {
      expect(status).toHaveLength(25);
    } catch (error) {
      throw new Error("Bad Request!");
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
      const url = "/" + this.endpoint + "?" + new URLSearchParams(params);
      //console.log(url);
      throw new Error("Filter count for criteria " + [criteria] + " failed (length = " + [items.length] + ", count = " + [count] + "). request: " + [url]);
    }

    const isValid = items.every(item => item[criteria] === value);
    if (isValid) {
      const params: Record<string, any> = {
        size: 1000,
        [criteria]: value,
      };
      const url = '/' + this.endpoint + '?' + new URLSearchParams(params);
      //console.log(url);
      throw new Error("Filter for criteria " + [criteria] + " failed.  request: " + [url]);
    }
  }

  private async checkPaginationInternal(allItems: any, from: number, size: number) {
    const items = await this.requestList({ from, size });
    expect(items).toEqual(allItems.slice(from, from + size));
  }

  private async requestItem(id: string, params: Record<string, any> = {}) {
    const urlParams = new URLSearchParams(params);

    const { body: result } = await request(this.httpServer)
      .get("/" + this.endpoint + "/" + id + "?" + urlParams);

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

    const { body: result } = await request(this.httpServer)
      .get("/" + this.endpoint + "?" + urlParams);

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

    const { body: result } = await request(this.httpServer)
      .get("/" + this.endpoint + "/count" + urlParams);

    return result;
  }

  private async requestAlternativeCount(params: Record<string, any>): Promise<number> {
    const urlParams = new URLSearchParams({
      ...this.defaultParams,
      ...params,
    });

    const { body: result } = await request(this.httpServer)
      .get("/" + this.endpoint + "/c" + urlParams);

    return result;
  }

  private async requestStatus(): Promise<number> {
    const result = await request(this.httpServer)
      .get("/" + this.endpoint);

    return result.statusCode;
  }

  private async requestBody(): Promise<any[]> {
    const result = await request(this.httpServer)
      .get("/" + this.endpoint);

    return result.body;
  }

  private async requestBodyCount(): Promise<string> {
    const result = await request(this.httpServer)
      .get("/" + this.endpoint);

    return result.text;
  }
}
