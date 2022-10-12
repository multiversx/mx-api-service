import { Injectable } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { GraphQLClient } from 'graphql-request';
import { OriginLogger } from "@elrondnetwork/erdnest";

@Injectable()
export class GraphQlService {
  private readonly logger = new OriginLogger(GraphQlService.name);

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) { }

  async getData(query: string, variables: any): Promise<any> {
    const MAIAR_EXCHANGE_URL = this.apiConfigService.getMaiarExchangeUrlMandatory();

    const graphqlClient = new GraphQLClient(MAIAR_EXCHANGE_URL);

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
}
