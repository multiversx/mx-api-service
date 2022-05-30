import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class GraphQlService {
  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(GraphQlService.name);
  }

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
