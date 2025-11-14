import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { PluginService } from 'src/common/plugins/plugin.service';
import { AssetsService } from 'src/common/assets/assets.service';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, OriginLogger, TokenUtils } from '@multiversx/sdk-nestjs-common';
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
import { TokenService } from '../tokens/token.service';
import { TokenDetailedWithBalance } from '../tokens/entities/token.detailed.with.balance';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { EsdtDetailsRepository } from 'src/common/indexer/db/repositories/esdt.details.repository';
import { EsdtDetails } from 'src/common/indexer/db/schemas/esdt.details.schema';

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
    private readonly esdtDetailsRepository: EsdtDetailsRepository,
    private readonly accountServiceV1: AccountService,
    private readonly tokenService: TokenService,
    private readonly gatewayService: GatewayService,
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
      const isStateChangesConsumerHealthy: boolean = await StateChangesConsumerService.isStateChangesConsumerHealthy(this.cachingService, 6000);
      if (isStateChangesConsumerHealthy === true && !StateChangesConsumerService.isSystemContractAddress(address)) {
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

  async getTokenForAddress(address: string, identifier: string): Promise<TokenDetailedWithBalance | undefined> {
    if (!TokenUtils.isToken(identifier) && !TokenUtils.isNft(identifier)) {
      return undefined;
    }
    try {
      let tokenDetailedWithBalance: TokenDetailedWithBalance | undefined;
      const isStateChangesConsumerHealthy: boolean = await StateChangesConsumerService.isStateChangesConsumerHealthy(this.cachingService, 6000);
      if (isStateChangesConsumerHealthy === true && !StateChangesConsumerService.isSystemContractAddress(address)) {
        tokenDetailedWithBalance = await this.getTokenForAddressWithFallback(address, identifier);
      } else {
        tokenDetailedWithBalance = await this.tokenService.getTokenForAddress(address, identifier);
      }
      return tokenDetailedWithBalance;
    } catch (err) {
      return undefined;
    }
  }

  async getTokenForAddressWithFallback(address: string, identifier: string): Promise<TokenDetailedWithBalance | undefined> {
    const tokenRaw = await this.cachingService.getOrSet(
      CacheInfo.AccountEsdt(address, identifier).key,
      async () => {
        const token = await this.esdtDetailsRepository.getEsdt(address, identifier);
        if (token) {
          return new EsdtDetails({
            identifier,
            balance: token.balance,
          });
        }

        const tokenFromGateway = await this.gatewayService.getAddressEsdt(address, identifier);
        if (tokenFromGateway) {
          return new EsdtDetails({
            identifier,
            balance: tokenFromGateway.balance,
          });
        }
        return undefined;
      },
      CacheInfo.AccountEsdt(address, identifier).ttl,
    );

    if (!tokenRaw) {
      return await this.getTokenForAddress(address, identifier);
    }
    const { balance } = tokenRaw;
    const esdtIdentifier = identifier.split('-').slice(0, 2).join('-');
    const tokens = await this.tokenService.getFilteredTokens({ identifier: esdtIdentifier, includeMetaESDT: true });
    if (!tokens.length) {
      this.logger.log(`Error when fetching token ${identifier} details for address ${address}`);
      return undefined;
    }

    const tokenData = tokens[0];

    const tokenDetailedWithBalance = new TokenDetailedWithBalance({ ...tokenData, balance });

    this.tokenService.applyValueUsd(tokenDetailedWithBalance);
    this.tokenService.applyTickerFromAssets(tokenDetailedWithBalance);
    await this.tokenService.applySupply(tokenDetailedWithBalance);

    return tokenDetailedWithBalance;
  }
}
