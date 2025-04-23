import { Injectable } from '@nestjs/common';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';
import { Application } from './entities/application';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ApplicationFilter } from './entities/application.filter';
import { AssetsService } from '../../common/assets/assets.service';
import { TransferService } from '../transfers/transfer.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { TransactionType } from '../transactions/entities/transaction.type';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/utils/cache.info';

@Injectable()
export class ApplicationService {

  constructor(
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly assetsService: AssetsService,
    private readonly transferService: TransferService,
    private readonly cacheService: CacheService,
  ) { }

  async getApplications(pagination: QueryPagination, filter: ApplicationFilter): Promise<Application[]> {
    filter.validate(pagination.size);

    if (!filter.isSet) {
      return await this.cacheService.getOrSet(
        CacheInfo.Applications(pagination).key,
        async () => await this.getApplicationsRaw(pagination, filter),
        CacheInfo.Applications(pagination).ttl
      );
    }

    return await this.getApplicationsRaw(pagination, filter);
  }

  async getApplicationsRaw(pagination: QueryPagination, filter: ApplicationFilter): Promise<Application[]> {
    const elasticResults = await this.elasticIndexerService.getApplications(filter, pagination);

    if (!elasticResults) {
      return [];
    }

    const assets = await this.assetsService.getAllAccountAssets();
    const verifiedAccounts = await this.cacheService.get<string[]>(CacheInfo.VerifiedAccounts.key) || [];
    const balances = await this.elasticIndexerService.getApplicationsBulkBalance(elasticResults.map(item => item.address), pagination);

    const applications = elasticResults.map(item => new Application({
      contract: item.address,
      deployer: item.deployer,
      owner: item.currentOwner,
      codeHash: item.initialCodeHash,
      timestamp: item.timestamp,
      assets: assets[item.address],
      balance: balances[item.address]?.balance || '0',
      isVerified: verifiedAccounts.includes(item.address),
      ...(filter.withTxCount && { txCount: 0 }),
    }));


    if (filter.withTxCount) {
      for (const application of applications) {
        application.txCount = await this.getApplicationTxCount(application.contract);
      }
    }

    return applications;
  }

  async getApplicationsCount(filter: ApplicationFilter): Promise<number> {
    return await this.elasticIndexerService.getApplicationCount(filter);
  }

  async getApplication(address: string): Promise<Application> {
    const indexResult = await this.elasticIndexerService.getApplication(address);
    const assets = await this.assetsService.getAllAccountAssets();
    const verifiedAccounts = await this.cacheService.get<string[]>(CacheInfo.VerifiedAccounts.key) || [];

    const pagination = new QueryPagination({ from: 0, size: 1 });
    const balances = await this.elasticIndexerService.getApplicationsBulkBalance([address], pagination);

    const result = new Application({
      contract: indexResult.address,
      deployer: indexResult.deployer,
      owner: indexResult.currentOwner,
      codeHash: indexResult.initialCodeHash,
      timestamp: indexResult.timestamp,
      assets: assets[address],
      balance: balances[address]?.balance || '0',
      txCount: 0,
      isVerified: verifiedAccounts.includes(address),
    });

    result.txCount = await this.getApplicationTxCount(result.contract);

    return result;
  }

  private async getApplicationTxCount(address: string): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.Transaction }));
  }
}
