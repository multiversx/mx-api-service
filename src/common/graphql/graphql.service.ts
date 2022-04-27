import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "../api-config/api.config.service";
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class GraphQlService {
  private readonly logger: Logger;
  private readonly MICROSERVICE_URL: string;
  private readonly graphqlClient: GraphQLClient;

  constructor(
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(GraphQlService.name);
    this.MICROSERVICE_URL = this.apiConfigService.getMicroServiceUrlMandatory();

    this.graphqlClient = new GraphQLClient(this.MICROSERVICE_URL);
  }

  async getData(query: string, variables: any): Promise<any> {
    try {
      const data = await this.graphqlClient.request(query, variables);

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
