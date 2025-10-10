import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AccountDetailed } from './entities/account.detailed';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { PluginService } from 'src/common/plugins/plugin.service';
import { TransferService } from '../transfers/transfer.service';
import { TransactionType } from '../transactions/entities/transaction.type';
import { AssetsService } from 'src/common/assets/assets.service';
import { TransactionFilter } from '../transactions/entities/transaction.filter';
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { GatewayService } from 'src/common/gateway/gateway.service';
import { IndexerService } from "src/common/indexer/indexer.service";
import { CacheInfo } from 'src/utils/cache.info';
import { UsernameService } from '../usernames/username.service';
import { ProtocolService } from 'src/common/protocol/protocol.service';
import { ProviderService } from '../providers/provider.service';
import { AccountFetchOptions } from './entities/account.fetch.options';
import { Provider } from '../providers/entities/provider';
import { AccountDetailsRepository } from 'src/common/indexer/db';
import { StateChangesConsumerService } from 'src/state-changes/state.changes.consumer.service';

@Injectable()
export class AccountServiceV2 {
  private readonly logger = new OriginLogger(AccountServiceV2.name);

  constructor(
    private readonly indexerService: IndexerService,
    private readonly gatewayService: GatewayService,
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    @Inject(forwardRef(() => PluginService))
    private readonly pluginService: PluginService,
    @Inject(forwardRef(() => TransferService))
    private readonly transferService: TransferService,
    private readonly assetsService: AssetsService,
    private readonly usernameService: UsernameService,
    private readonly apiService: ApiService,
    private readonly protocolService: ProtocolService,
    @Inject(forwardRef(() => ProviderService))
    private readonly providerService: ProviderService,
    private readonly accountDetailsDepository: AccountDetailsRepository,
  ) { }

  private async getAccountWithFallBack(address: string, options?: AccountFetchOptions): Promise<AccountDetailed | null> {
    //  First try to get account from MongoDB if it is wallet address
    let accountFromDb = null;
    if (!AddressUtils.isSmartContractAddress(address)) {
      accountFromDb = await this.accountDetailsDepository.getAccount(address);
    }
    if (!accountFromDb) {
      // Second use the legacy method
      return await this.getAccountRaw(address, options?.withAssets);
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
          async () => this.getAccountWithFallBack(address, options),
          CacheInfo.AccountState(address).ttl,
        )
      } else {
        account = await this.getAccountRaw(address, options?.withAssets);
      }

      if (!account) {
        return null;
      }

      if (options?.withTxCount === true) {
        account.txCount = await this.getAccountTxCount(address);
      }

      if (options?.withScrCount === true) {
        account.scrCount = await this.getAccountScResults(address);
      }

      if (options?.withGuardianInfo === true) {
        await this.applyGuardianInfo(account);
      }

      if (options?.withTimestamp) {
        if (!account.timestamp) {
          const elasticSearchAccount = await this.indexerService.getAccount(address);
          account.timestamp = elasticSearchAccount.timestamp;
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

  async applyGuardianInfo(account: AccountDetailed): Promise<void> {
    try {
      const guardianResult = await this.gatewayService.getGuardianData(account.address);
      const guardianData = guardianResult?.guardianData;
      if (guardianData) {
        const activeGuardian = guardianData.activeGuardian;
        if (activeGuardian) {
          account.activeGuardianActivationEpoch = activeGuardian.activationEpoch;
          account.activeGuardianAddress = activeGuardian.address;
          account.activeGuardianServiceUid = activeGuardian.serviceUID;
        }

        const pendingGuardian = guardianData.pendingGuardian;
        if (pendingGuardian) {
          account.pendingGuardianActivationEpoch = pendingGuardian.activationEpoch;
          account.pendingGuardianAddress = pendingGuardian.address;
          account.pendingGuardianServiceUid = pendingGuardian.serviceUID;
        }

        account.isGuarded = guardianData.guarded;
      }
    } catch (error) {
      this.logger.error(`Error when getting guardian data for address '${account.address}'`);
      this.logger.error(error);
    }
  }

  async getAccountRaw(address: string, withAssets?: boolean): Promise<AccountDetailed | null> {
    try {
      const {
        account: { nonce, balance, code, codeHash, rootHash, developerReward, ownerAddress, codeMetadata },
      } = await this.gatewayService.getAddressDetails(address);

      const shardCount = await this.protocolService.getShardCount();
      const shard = AddressUtils.computeShard(AddressUtils.bech32Decode(address), shardCount);
      let account = new AccountDetailed({ address, nonce, balance, code, codeHash, rootHash, shard, developerReward, ownerAddress, scamInfo: undefined, nftCollections: undefined, nfts: undefined });

      if (withAssets === true) {
        const assets = await this.assetsService.getAllAccountAssets();
        account.assets = assets[address];
        account.ownerAssets = assets[ownerAddress];
      }

      if (AddressUtils.isSmartContractAddress(address) && account.code) {
        const codeAttributes = AddressUtils.decodeCodeMetadata(codeMetadata);
        if (codeAttributes) {
          account = { ...account, ...codeAttributes };
        }

        const deployTxHash = await this.getAccountDeployedTxHash(address);
        if (deployTxHash) {
          account.deployTxHash = deployTxHash;
        }

        const deployedAt = await this.getAccountDeployedAt(address);
        if (deployedAt) {
          account.deployedAt = deployedAt;
        }

        const isVerified = await this.getAccountIsVerified(address, account.codeHash);
        if (isVerified) {
          account.isVerified = isVerified;
        }
      }

      if (!AddressUtils.isSmartContractAddress(address)) {
        account.username = await this.usernameService.getUsernameForAddress(address) ?? undefined;
        account.isPayableBySmartContract = undefined;
        account.isUpgradeable = undefined;
        account.isReadable = undefined;
        account.isPayable = undefined;
      }

      await this.pluginService.processAccount(account);
      return account;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting account details for address '${address}'`);
      return null;
    }
  }

  async getAccountTxCount(address: string): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.Transaction }));
  }

  async getAccountScResults(address: string): Promise<number> {
    return await this.transferService.getTransfersCount(new TransactionFilter({ address, type: TransactionType.SmartContractResult }));
  }

  async getAccountDeployedAt(address: string): Promise<number | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployedAt(address).key,
      async () => await this.getAccountDeployedAtRaw(address),
      CacheInfo.AccountDeployedAt(address).ttl
    );
  }

  async getAccountDeployedAtRaw(address: string): Promise<number | null> {
    const scDeploy = await this.indexerService.getScDeploy(address);
    if (!scDeploy) {
      return null;
    }

    const txHash = scDeploy.deployTxHash;
    if (!txHash) {
      return null;
    }

    const transaction = await this.indexerService.getTransaction(txHash);
    if (!transaction) {
      return null;
    }

    return transaction.timestamp;
  }

  async getAccountDeployedTxHash(address: string): Promise<string | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountDeployTxHash(address).key,
      async () => await this.getAccountDeployedTxHashRaw(address),
      CacheInfo.AccountDeployTxHash(address).ttl,
    );
  }

  async getAccountDeployedTxHashRaw(address: string): Promise<string | null> {
    const scDeploy = await this.indexerService.getScDeploy(address);
    if (!scDeploy) {
      return null;
    }

    return scDeploy.deployTxHash;
  }

  async getAccountIsVerified(address: string, codeHash: string): Promise<boolean | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.AccountIsVerified(address).key,
      async () => await this.getAccountIsVerifiedRaw(address, codeHash),
      CacheInfo.AccountIsVerified(address).ttl
    );
  }

  async getAccountIsVerifiedRaw(address: string, codeHash: string): Promise<boolean | null> {
    try {
      // eslint-disable-next-line require-await
      const { data } = await this.apiService.get(`${this.apiConfigService.getVerifierUrl()}/verifier/${address}/codehash`, undefined, async (error) => error.response?.status === HttpStatus.NOT_FOUND);

      if (data.codeHash === Buffer.from(codeHash, 'base64').toString('hex')) {
        return true;
      }
    } catch {
      // ignore
    }

    return null;
  }
}
