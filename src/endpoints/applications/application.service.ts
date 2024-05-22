import { Injectable } from "@nestjs/common";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { Application } from "./entities/application";
import { QueryPagination } from "src/common/entities/query.pagination";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { ApplicationFilter } from "./entities/application.filter";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly cacheService: CacheService
  ) { }

  async getApplications(queryPagination: QueryPagination, filter: ApplicationFilter): Promise<Application[]> {
    if (filter.isSet()) {
      return await this.cacheService.getOrSet(
        CacheInfo.Applications(queryPagination).key,
        async () => await this.getApplicationsRaw(queryPagination, filter),
        CacheInfo.Applications(queryPagination).ttl
      );
    }
    return await this.getApplicationsRaw(queryPagination, filter);
  }

  async getApplicationsRaw(queryPagination: QueryPagination, filter: ApplicationFilter): Promise<Application[]> {
    const elasticResults = await this.elasticIndexerService.getAllScDeploysContracts(filter);
    const { from, size } = queryPagination;

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

    return applications.slice(from, from + size);
  }

  async getApplicationsCount(): Promise<number> {
    return await this.elasticIndexerService.getAllScDeploysContractsCount();
  }
}
