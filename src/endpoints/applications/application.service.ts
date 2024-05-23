import { Injectable } from "@nestjs/common";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { Application } from "./entities/application";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ApplicationFilter } from "./entities/application.filter";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly elasticIndexerService: ElasticIndexerService,
  ) { }

  async getApplications(pagination: QueryPagination, filter: ApplicationFilter): Promise<Application[]> {
    const elasticResults = await this.elasticIndexerService.getApplications(filter, pagination);
    if (!elasticResults) {
      return [];
    }

    const applications: Application[] = elasticResults.map(item => ({
      contract: item.address,
      deployer: item.deployer,
      owner: item.currentOwner,
      codeHash: item.initialCodeHash,
      timestamp: item.timestamp,
    }));

    return applications;
  }

  async getApplicationsCount(filter: ApplicationFilter): Promise<number> {
    return await this.elasticIndexerService.getApplicationCount(filter);
  }
}
