import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PluginService } from 'src/common/plugins/plugin.service';
import { AssetsService } from 'src/common/assets/assets.service';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { IndexerService } from "src/common/indexer/indexer.service";
import { CacheInfo } from 'src/utils/cache.info';
import { UsernameService } from '../usernames/username.service';
import { ProviderService } from '../providers/provider.service';
import { Provider } from '../providers/entities/provider';
import { AccountDetailsRepository } from 'src/common/indexer/db';
import { StateChangesConsumerService } from 'src/state-changes/state.changes.consumer.service';
import { AccountService } from '../accounts/account.service';
import { AccountDetailed } from '../accounts/entities/account.detailed';
import { AccountFetchOptions } from '../accounts/entities/account.fetch.options';

@Injectable()
export class AccountServiceV2 {
  private readonly logger = new OriginLogger(AccountServiceV2.name);

  constructor(
    private readonly indexerService: IndexerService,
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => PluginService))
    private readonly pluginService: PluginService,
    private readonly assetsService: AssetsService,
    private readonly usernameService: UsernameService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly accountDetailsDepository: AccountDetailsRepository,
    private readonly accountServiceV1: AccountService,
  ) { }

  private async getAccountWithFallBack(address: string, options?: AccountFetchOptions): Promise<AccountDetailed | null> {
    //  First try to get account from MongoDB if it is wallet address
    let accountFromDb = null;
    if (!AddressUtils.isSmartContractAddress(address)) {
      accountFromDb = await this.accountDetailsDepository.getAccount(address);
    }
    if (!accountFromDb) {
      // Second use the legacy method
      return await this.accountServiceV1.getAccountRaw(address, options?.withAssets);
    }
    if (options && options.withAssets === true) {
      const assets = await this.assetsService.getAllAccountAssets();
      accountFromDb.assets = assets[address];
      if (accountFromDb.ownerAddress && accountFromDb.ownerAddress !== '') {
        accountFromDb.ownerAssets = assets[accountFromDb.ownerAddress];
      }
    }

    accountFromDb.username = await this.usernameService.getUsernameForAddress(address) ?? undefined;
    await this.pluginService.processAccount(accountFromDb);
    return accountFromDb;
  }

  async getAccount(address: string, options?: AccountFetchOptions): Promise<AccountDetailed | null> {
    if (!AddressUtils.isAddressValid(address)) {
      return null;
    }
    let account = null;
    try {
      const isStateChangesConsumerHealty: boolean = await StateChangesConsumerService.isStateChangesConsumerHealthy(this.cachingService, 6000);
      if (isStateChangesConsumerHealty === true && !StateChangesConsumerService.isSystemContractAddress(address)) {
        account = await this.cachingService.getOrSet(
          CacheInfo.AccountState(address).key,
          async () => await this.getAccountWithFallBack(address, options),
          CacheInfo.AccountState(address).ttl,
        );
        if (account?.username) {
          account.username = await this.usernameService.getUsernameForAddress(address) ?? undefined;
        }
      } else {
        account = await this.accountServiceV1.getAccountRaw(address, options?.withAssets);
      }

      if (!account) {
        return null;
      }

      if (options?.withTxCount === true) {
        account.txCount = await this.accountServiceV1.getAccountTxCount(address);
      }

      if (options?.withScrCount === true) {
        account.scrCount = await this.accountServiceV1.getAccountScResults(address);
      }

      if (options?.withGuardianInfo === true) {
        await this.accountServiceV1.applyGuardianInfo(account);
      }

      if (options?.withTimestamp) {
        if (!account.timestamp || !account.timestampMs) {
          const elasticSearchAccount = await this.indexerService.getAccount(address);
          if (!account.timestamp) {
            account.timestamp = elasticSearchAccount.timestamp;
          }
          if (!account.timestampMs && elasticSearchAccount.timestampMs) {
            account.timestampMs = elasticSearchAccount.timestampMs;
          }
        }
      }

      if (AddressUtils.isSmartContractAddress(address) && !account.ownerAddress) {
        const provider: Provider | undefined = await this.providerService.getProvider(address);
        if (provider && provider.owner) {
          account.ownerAddress = provider.owner;
        }
      }
    } catch (error) {
      this.logger.error(`Error when getting account for address '${address}'`);
      this.logger.error(error);
      return null;
    }

    return account;
  }
}
