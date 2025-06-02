import { Injectable, Logger } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { ElasticIndexerService } from "src/common/indexer/elastic/elastic.indexer.service";
import { Applications } from "./entities/applications";
import { ApplicationFilter, UsersCountRange } from "./entities/application.filter";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly cachingService: CacheService
  ) { }

  async getApplications(pagination: QueryPagination, filter: ApplicationFilter): Promise<Applications[]> {
    if (!filter.isSet()) {
      return await this.cachingService.getOrSet(
        CacheInfo.Applications(pagination).key,
        async () => await this.getApplicationsRaw(pagination, filter),
        CacheInfo.Applications(pagination).ttl
      );
    }

    return await this.getApplicationsRaw(pagination, filter);
  }

  private async getApplicationsRaw(pagination: QueryPagination, filter: ApplicationFilter): Promise<Applications[]> {
    const elasticResults = await this.elasticIndexerService.getApplications(filter, pagination);
    const applications = elasticResults.map(result => new Applications({
      address: result.address,
      balance: result.balance || '0',
      usersCount: 0,
      feesCaptured: '0',
      deployedAt: 0,
      deployTxHash: '',
      isVerified: result.api_isVerified || false,
      txCount: result.api_transfersLast24h || 0,
      assets: result.api_assets,
    }));

    await Promise.all(applications.map(application => this.enrichApplicationData(application, filter)));

    return applications;
  }

  private async enrichApplicationData(application: Applications, filter: ApplicationFilter): Promise<void> {
    const usersRange = filter.usersCountRange || UsersCountRange._24h;
    const feesRange = filter.feesRange || UsersCountRange._24h;

    try {
      const deploymentDataPromise = this.getAccountDeploymentData(application.address);

      const [deploymentData, usersCount, feesCaptured] = await Promise.all([
        deploymentDataPromise,
        this.getApplicationUsersCount(application.address, usersRange),
        this.getApplicationFeesCaptured(application.address, feesRange),
      ]);

      if (deploymentData.deployedAt) {
        application.deployedAt = deploymentData.deployedAt;
      }
      if (deploymentData.deployTxHash) {
        application.deployTxHash = deploymentData.deployTxHash;
      }
      application.usersCount = usersCount;
      application.feesCaptured = feesCaptured;
    } catch (error) {
      this.logger.error(`Failed to enrich data for application ${application.address}:`, error);
    }
  }

  async getApplicationsCount(filter: ApplicationFilter): Promise<number> {
    return await this.elasticIndexerService.getApplicationCount(filter);
  }

  private async getAccountDeploymentData(address: string): Promise<{ deployedAt: number | null; deployTxHash: string | null }> {
    try {
      const scDeploy = await this.elasticIndexerService.getScDeploy(address);
      if (!scDeploy) {
        return { deployedAt: null, deployTxHash: null };
      }

      const deployTxHash = scDeploy.deployTxHash;
      if (!deployTxHash) {
        return { deployedAt: null, deployTxHash };
      }

      const transaction = await this.elasticIndexerService.getTransaction(deployTxHash);
      const deployedAt = transaction?.timestamp || null;

      return { deployedAt, deployTxHash };
    } catch (error) {
      this.logger.error(`Failed to get deployment data for ${address}:`, error);
      return { deployedAt: null, deployTxHash: null };
    }
  }

  async getAccountDeployedAt(address: string): Promise<number | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployedAt(address).key,
      async () => {
        const { deployedAt } = await this.getAccountDeploymentData(address);
        return deployedAt;
      },
      CacheInfo.AccountDeployedAt(address).ttl
    );
  }

  async getAccountDeployedAtRaw(address: string): Promise<number | null> {
    const { deployedAt } = await this.getAccountDeploymentData(address);
    return deployedAt;
  }

  async getAccountDeployedTxHash(address: string): Promise<string | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployTxHash(address).key,
      async () => {
        const { deployTxHash } = await this.getAccountDeploymentData(address);
        return deployTxHash;
      },
      CacheInfo.AccountDeployTxHash(address).ttl,
    );
  }

  async getAccountDeployedTxHashRaw(address: string): Promise<string | null> {
    const { deployTxHash } = await this.getAccountDeploymentData(address);
    return deployTxHash;
  }

  async getApplicationUsersCount(applicationAddress: string, range: UsersCountRange): Promise<number> {
    return await this.elasticIndexerService.getApplicationUsersCount(applicationAddress, range);
  }

  async getApplicationFeesCaptured(applicationAddress: string, range: UsersCountRange): Promise<string> {
    return await this.elasticIndexerService.getApplicationFeesCaptured(applicationAddress, range);
  }

  async getApplication(address: string): Promise<Applications> {
    const application = await this.elasticIndexerService.getApplication(address);
    return new Applications({
      address: application.address,
      balance: application.balance || '0',
      usersCount: 0,
      feesCaptured: '0',
      deployedAt: 0,
      deployTxHash: '',
      isVerified: application.api_isVerified || false,
      txCount: application.api_transfersLast24h || 0,
      assets: application.api_assets,
    });
  }
}
