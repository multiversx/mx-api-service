import { Injectable } from '@nestjs/common';
import { ElasticIndexerService } from 'src/common/indexer/elastic/elastic.indexer.service';
import { Application } from './entities/application';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { ApplicationFilter, UsersCountRange } from './entities/application.filter';
import { AssetsService } from '../../common/assets/assets.service';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { TransferService } from '../transfers/transfer.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { TransactionType } from '../transactions/entities/transaction.type';
import { Logger } from '@nestjs/common';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/utils/cache.info';
import { UsersCountUtils } from 'src/utils/users.count.utils';

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
      isVerified: item.api_isVerified,
      balance: '0',
      developerRewards: '0',
      ...(filter.withTxCount && { txCount: 0 }),
    }));

    await this.setApplicationsBalancesAndDeveloperRewardsBulk(applications);

    if (filter.withTxCount) {
      for (const application of applications) {
        application.txCount = await this.getApplicationTxCount(application.contract);
      }
    }

    for (const application of applications) {
      if (filter.usersCountRange) {
        application.usersCount = await this.getApplicationUsersCount(application.contract, filter.usersCountRange);
      }
    }

    for (const application of applications) {
      application.feesCaptured24h = await this.getApplicationFeesCaptured(application.contract, UsersCountRange._24h);
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
      isVerified: indexResult.api_isVerified,
      assets: assets[address],
      balance: '0',
      developerRewards: '0',
      txCount: 0,
    });

    result.txCount = await this.getApplicationTxCount(result.contract);
    result.balance = await this.getApplicationBalance(result.contract);
    result.developerRewards = await this.getApplicationDeveloperReward(result.contract);
    result.usersCount = await this.getApplicationUsersCount(result.contract, UsersCountRange._24h);
    result.feesCaptured24h = await this.getApplicationFeesCaptured(result.contract, UsersCountRange._24h);

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

  private async getApplicationUsersCountRaw(address: string, range: UsersCountRange): Promise<number | null> {
    try {
      const usersCount = await this.elasticIndexerService.getApplicationUsersCount(address, range);
      return usersCount;
    } catch (error) {
      this.logger.error(`Error getting users count for application ${address} with range ${range}: ${error}`);
      return null;
    }
  }

  private async getApplicationUsersCount(address: string, range: UsersCountRange): Promise<number | null> {
    return await this.cacheService.getOrSet(
      CacheInfo.ApplicationUsersCount(address, range).key,
      async () => await this.getApplicationUsersCountRaw(address, range),
      UsersCountUtils.getTTLForRange(range)
    );
  }

  private async getApplicationFeesCapturedRaw(address: string, range: UsersCountRange): Promise<string | null> {
    try {
      const feesCaptured = await this.elasticIndexerService.getApplicationFeesCaptured(address, range);
      return feesCaptured;
    } catch (error) {
      this.logger.error(`Error getting fees captured for application ${address} with range ${range}: ${error}`);
      return null;
    }
  }

  private async getApplicationFeesCaptured(address: string, range: UsersCountRange): Promise<string | null> {
    return await this.cacheService.getOrSet(
      CacheInfo.ApplicationFeesCaptured(address, range).key,
      async () => await this.getApplicationFeesCapturedRaw(address, range),
      UsersCountUtils.getTTLForRange(range)
    );
  }

  private async getApplicationDeveloperReward(address: string): Promise<string> {
    try {
      const { account: { developerReward } } = await this.gatewayService.getAddressDetails(address);
      return developerReward || '0';
    } catch (error) {
      this.logger.error(`Error when getting developer reward for contract ${address}`, error);
      return '0';
    }
  }

  private async setApplicationsBalancesAndDeveloperRewardsBulk(applications: Application[]): Promise<void> {
    try {
      const addresses = applications.map(app => app.contract);
      const accounts: Record<string, any> = await this.gatewayService.getAccountsBulk(addresses);

      for (const application of applications) {
        const account = accounts[application.contract];
        application.balance = account?.balance || '0';
        application.developerRewards = account?.developerReward || '0';
      }
    } catch (error) {
      this.logger.error(`Error getting bulk balances and developer rewards: ${error}`);
      const balancePromises = applications.map(application =>
        this.getApplicationBalance(application.contract)
          .then(balance => { application.balance = balance; })
      );
      const developerRewardPromises = applications.map(application =>
        this.getApplicationDeveloperReward(application.contract)
          .then(developerReward => { application.developerRewards = developerReward; })
      );
      await Promise.all([...balancePromises, ...developerRewardPromises]);
    }
  }
}
