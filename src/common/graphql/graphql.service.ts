import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { GraphQLClient } from 'graphql-request';
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import fetch, { RequestInit } from 'node-fetch';

@Injectable()
export class GraphQlService {
  private readonly logger = new OriginLogger(GraphQlService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  async getExchangeServiceData(query: string, variables?: any): Promise<any> {
    const exchangeServiceUrl = this.apiConfigService.getExchangeServiceUrlMandatory();
    const graphqlClient = new GraphQLClient(exchangeServiceUrl, {
      fetch: this.createFetchWithTimeout(60_000),
      headers: {
        'origin': this.apiConfigService.getSelfUrl(),
      },
    });

    try {
      const data = variables
        ? await graphqlClient.request(query, variables)
        : await graphqlClient.request(query);

      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      this.logger.log(`Unexpected error when running graphql query`);
      this.logger.error(error);

      return null;
    }
  }

  async getNftServiceData(query: string, variables: any): Promise<any> {
    const nftMarketplaceUrl = this.apiConfigService.getMarketplaceServiceUrl();
    const graphqlClient = new GraphQLClient(nftMarketplaceUrl, {
      fetch: this.createFetchWithTimeout(60_0000),
    });

    try {
      const data = await graphqlClient.request(query, variables);

      if (!data) {
        return null;
      }

      return data;
    } catch (error) {
      this.logger.log(`Unexpected error when running graphql query`);
      this.logger.error(error);

      return null;
    }
  }

  private createFetchWithTimeout(timeout: number) {
    return (url: string, init?: RequestInit) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const initWithSignal = { ...init, signal: controller.signal };

      return fetch(url, initWithSignal).finally(() => clearTimeout(id));
    };
  }
}
