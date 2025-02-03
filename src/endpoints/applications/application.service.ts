import { Injectable } from '@nestjs/common';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';
import { Application } from './entities/application';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ApplicationFilter } from './entities/application.filter';
import { AssetsService } from '../../common/assets/assets.service';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { TransferService } from '../transfers/transfer.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { TransactionType } from '../transactions/entities/transaction.type';
import { Logger } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/utils/cache.info';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    private readonly elasticIndexerService: ElasticIndexerService,
    private readonly assetsService: AssetsService,
    private readonly gatewayService: GatewayService,
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
    const assets = await this.assetsService.getAllAccountAssets();

    if (!elasticResults) {
      return [];
    }

    const applications = elasticResults.map(item => new Application({
      contract: item.address,
      deployer: item.deployer,
      owner: item.currentOwner,
      codeHash: item.initialCodeHash,
      timestamp: item.timestamp,
      assets: assets[item.address],
      balance: '0',
      ...(filter.withTxCount && { txCount: 0 }),
    }));

    const balancePromises = applications.map(application =>
      this.getApplicationBalance(application.contract)
        .then(balance => { application.balance = balance; })
    );
    await Promise.all(balancePromises);

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

    const result = new Application({
      contract: indexResult.address,
      deployer: indexResult.deployer,
      owner: indexResult.currentOwner,
      codeHash: indexResult.initialCodeHash,
      timestamp: indexResult.timestamp,
      assets: assets[address],
      balance: '0',
      txCount: 0,
    });

    result.txCount = await this.getApplicationTxCount(result.contract);
    result.balance = await this.getApplicationBalance(result.contract);

    return result;
  }

  private async getApplicationTxCount(address: string): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.Transaction }));
  }

  private async getApplicationBalance(address: string): Promise<string> {
    try {
      const { account: { balance } } = await this.gatewayService.getAddressDetails(address);
      return balance;
    } catch (error) {
      this.logger.error(`Error when getting balance for contract ${address}`, error);
      return '0';
    }
  }
}
