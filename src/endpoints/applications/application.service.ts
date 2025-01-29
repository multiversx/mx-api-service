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

    await Promise.all(applications.map(async (application) => {
      const promises: Promise<void>[] = [];

      promises.push((async () => {
        try {
          const { account: { balance } } = await this.gatewayService.getAddressDetails(application.contract);
          application.balance = balance;
        } catch (error) {
          this.logger.error(`Error when getting balance for contract ${application.contract}`, error);
          application.balance = '0';
        }
      })());

      if (filter.withTxCount) {
        promises.push((async () => {
          application.txCount = await this.getApplicationTxCount(application.contract);
        })());
      }

      await Promise.all(promises);
    }));

    return applications;
  }

  async getApplicationsCount(filter: ApplicationFilter): Promise<number> {
    return await this.elasticIndexerService.getApplicationCount(filter);
  }

  async getApplicationTxCount(address: string): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.Transaction }));
  }
}
