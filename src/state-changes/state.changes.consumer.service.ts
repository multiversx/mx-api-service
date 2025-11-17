import { CompetingRabbitConsumer } from "src/common/rabbitmq/rabbitmq.consumers";
import { BlockWithStateChangesRaw, ESDTType, StateChanges } from "./entities";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db";
import { Inject, Injectable } from "@nestjs/common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { TokenType } from "src/common/indexer/entities";
import { NftType } from "src/endpoints/nfts/entities/nft.type";
import { NftSubType } from "src/endpoints/nfts/entities/nft.sub.type";
import { ClientProxy } from "@nestjs/microservices";
import { StateChangesDecoder } from "./utils/state-changes.decoder";
import { AddressUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import configuration from "config/configuration";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NftAccount } from "src/endpoints/nfts/entities/nft.account";
import { TokenWithBalance } from "src/endpoints/tokens/entities/token.with.balance";

@Injectable()
export class StateChangesConsumerService {
  private readonly logger = new OriginLogger(StateChangesConsumerService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly accountDetailsRepository: AccountDetailsRepository,
    private readonly apiConfigService: ApiConfigService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
  ) { }

  @CompetingRabbitConsumer({
    exchange: configuration().features.stateChanges.exchange ?? 'state_accesses',
    queueName: configuration().features.stateChanges.queueName ?? 'api_state_accesses_queue',
    deadLetterExchange: configuration().features.stateChanges.deadLetterExchange ?? 'api_state_accesses_queue_dlx',
  })
  async consumeEvents(blockWithStateChanges: BlockWithStateChangesRaw) {
    try {
      if (blockWithStateChanges.shardID === this.apiConfigService.getMetaChainShardId()) {
        return; // skip meta shard
      }

      const profiler = new PerformanceProfiler('BlockStateChangesProcessing');
      const decodingProfiler = new PerformanceProfiler('StateChangesDecoding');

      const finalStates = this.decodeStateChangesFinal(blockWithStateChanges);
      const transformedFinalStates = this.transformFinalStatesToDbFormat(finalStates, blockWithStateChanges.shardID, blockWithStateChanges.timestampMs);
      decodingProfiler.stop('StateChangesDecoding');
      this.logger.log(`Decoded state changes for block ${blockWithStateChanges.hash} on shard ${blockWithStateChanges.shardID} in ${decodingProfiler.duration} ms`);

      await this.updateAccounts(transformedFinalStates);

      await this.cacheService.setRemote(
        CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(blockWithStateChanges.shardID).key,
        blockWithStateChanges.timestampMs,
        CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(blockWithStateChanges.shardID).ttl,
      );

      profiler.stop('BlockStateChangesProcessing');
      this.logger.log(`Processed state changes for block ${blockWithStateChanges.hash} on shard ${blockWithStateChanges.shardID} in ${profiler.duration} ms`);
    } catch (error) {
      this.logger.error(`Error consuming state changes from shard ${blockWithStateChanges.shardID}:`, error);
      throw error;
    }
  }

  private async updateAccounts(transformedFinalStates: AccountDetails[]) {
    const promisesToWaitFor = [this.accountDetailsRepository.updateAccounts(transformedFinalStates.filter(account => !AddressUtils.isSmartContractAddress(account.address)))];

    const walletCacheKeys = [];
    const contractCacheKeys = [];
    const values = [];
    for (const account of transformedFinalStates) {
      if (!AddressUtils.isSmartContractAddress(account.address)) {
        walletCacheKeys.push(CacheInfo.AccountState(account.address).key);
        const { tokens, nfts, ...accountWithoutAssets } = account;
        values.push(accountWithoutAssets);
      } else {
        contractCacheKeys.push(CacheInfo.AccountState(account.address).key);
      }
    }
    if (walletCacheKeys.length > 0) {
      promisesToWaitFor.push(
        this.cacheService.setManyRemote(
          walletCacheKeys,
          values,
          CacheInfo.AccountState('any').ttl,
        )
      );
    }

    if (contractCacheKeys.length > 0) {
      promisesToWaitFor.push(
        this.cacheService.deleteManyRemote(
          contractCacheKeys,
        )
      );
    }

    this.deleteLocalCache([...walletCacheKeys, ...contractCacheKeys]);

    await Promise.all(promisesToWaitFor);
  }
  private decodeStateChangesFinal(blockWithStateChanges: BlockWithStateChangesRaw) {
    const isEsdtComputationEnabled = this.apiConfigService.isEsdtComputationEnabled();
    return StateChangesDecoder.decodeStateChangesFinal(blockWithStateChanges, isEsdtComputationEnabled);
  }

  private transformFinalStatesToDbFormat(
    finalStates: Record<string, StateChanges>,
    shardID: number,
    blockTimestampMs: number,
  ) {
    const isEsdtComputationEnabled = this.apiConfigService.isEsdtComputationEnabled();
    const transformed: AccountDetails[] = [];

    for (const [_address, state] of Object.entries(finalStates)) {
      const baseAccount = this.parseBaseAccount(
        state,
        shardID,
        blockTimestampMs
      );
      if (!baseAccount) continue;

      const parsedAccount = new AccountDetails({
        ...baseAccount,
      });

      if (isEsdtComputationEnabled) {
        const tokens = this.transformTokens(state);
        const nfts = this.transformNfts(state);
        parsedAccount.tokens = tokens;
        parsedAccount.nfts = nfts;
      }

      transformed.push(parsedAccount);
    }

    return transformed;
  }

  private parseBaseAccount(
    state: StateChanges,
    shardID: number,
    blockTimestampMs: number
  ) {
    if (!state.accountState) return undefined;
    const { codeMetadata, ...filteredState } = state.accountState;

    return {
      ...filteredState,
      shard: shardID,
      timestampMs: blockTimestampMs,
      timestamp: Math.floor(blockTimestampMs / 1000),
      ...this.parseCodeMetadata(filteredState.address, codeMetadata),
    };
  }

  private transformTokens(state: StateChanges): TokenWithBalance[] {
    const fungible = state.esdtState?.Fungible ?? [];

    return fungible.map(token =>
      new TokenWithBalance({
        identifier: token.identifier,
        nonce: parseInt(token.nonce),
        balance: token.value,
        type: this.parseEsdtType(token.type) as TokenType,
        subType: NftSubType.None,
      })
    );
  }

  private transformNfts(state: StateChanges): NftAccount[] {
    const {
      NonFungible,
      NonFungibleV2,
      DynamicNFT,
      SemiFungible,
      DynamicSFT,
      MetaFungible,
      DynamicMeta,
    } = state.esdtState ?? {};

    const allNfts = [
      ...(NonFungible ?? []),
      ...(NonFungibleV2 ?? []),
      ...(DynamicNFT ?? []),
      ...(SemiFungible ?? []),
      ...(DynamicSFT ?? []),
      ...(MetaFungible ?? []),
      ...(DynamicMeta ?? []),
    ];

    return allNfts.map(nft =>
      new NftAccount({
        identifier: nft.identifier,
        nonce: parseInt(nft.nonce),
        type: this.parseEsdtType(nft.type) as NftType,
        subType: this.parseEsdtSubtype(nft.type),
        collection: nft.identifier.replace(/-[^-]*$/, ''),
        balance: nft.value,
      })
    );
  }


  private deleteLocalCache(cacheKeys: string[]) {
    this.clientProxy.emit('deleteCacheKeys', cacheKeys);
  }

  private parseCodeMetadata(address: string, hexStr?: string) {
    if (!hexStr || hexStr === '') {
      return {};
    }

    if (!AddressUtils.isSmartContractAddress(address)) {
      const GUARDED = 0x08_00;
      const value = parseInt(hexStr, 16);
      return {
        isGuarded: (value & GUARDED) !== 0,
      };
    }

    const UPGRADEABLE = 0x01_00; // 256
    const READABLE = 0x04_00; // 1024
    const PAYABLE = 0x00_02; // 2
    const PAYABLE_BY_SC = 0x00_04; // 4
    const value = parseInt(hexStr, 16);

    return {
      isUpgradeable: (value & UPGRADEABLE) !== 0,
      isReadable: (value & READABLE) !== 0,
      isPayable: (value & PAYABLE) !== 0,
      isPayableBySmartContract: (value & PAYABLE_BY_SC) !== 0,
    };
  }

  //@ts-ignore
  private parseEsdtType(type: ESDTType): TokenType | NftType {
    switch (type) {
      case ESDTType.Fungible:
        return TokenType.FungibleESDT;

      case ESDTType.NonFungible:
      case ESDTType.DynamicNFT:
      case ESDTType.NonFungibleV2:
        return NftType.NonFungibleESDT;

      case ESDTType.SemiFungible:
      case ESDTType.DynamicSFT:
        return NftType.SemiFungibleESDT;
      case ESDTType.MetaFungible:
      case ESDTType.DynamicMeta:
        return NftType.MetaESDT;
    }
  }

  //@ts-ignore
  private parseEsdtSubtype(type: ESDTType): NftSubType {
    switch (type) {
      case ESDTType.Fungible:
        return NftSubType.None;

      case ESDTType.NonFungible:
        return NftSubType.NonFungibleESDT;
      case ESDTType.DynamicNFT:
        return NftSubType.DynamicNonFungibleESDT;
      case ESDTType.NonFungibleV2:
        return NftSubType.NonFungibleESDTv2;

      case ESDTType.SemiFungible:
        return NftSubType.SemiFungibleESDT;
      case ESDTType.DynamicSFT:
        return NftSubType.DynamicSemiFungibleESDT;
      case ESDTType.MetaFungible:
        return NftSubType.MetaESDT;
      case ESDTType.DynamicMeta:
        return NftSubType.DynamicMetaESDT;
    }
  }

  static async isStateChangesConsumerHealthy(cacheService: CacheService, maxLastActivityDiffMs: number): Promise<boolean> {
    const keys = [
      CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(0).key,
      CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(1).key,
      CacheInfo.StateChangesConsumerLatestProcessedBlockTimestamp(2).key,
    ];

    let timestampsMs: (number | undefined | null)[] | undefined = cacheService.getManyLocal(keys);

    // check local
    if (timestampsMs == null || timestampsMs.some(t => t == null)) {
      timestampsMs = await cacheService.getManyRemote(keys);

      // check remote
      if (timestampsMs == null || timestampsMs.some(t => t == null)) {
        return false;
      }

      // set only if it's valid
      cacheService.setManyLocal(keys, timestampsMs, 0.6);
    }

    const minTimestamp = Math.min(...(timestampsMs as number[]));

    const diff = Date.now() - minTimestamp;

    return diff <= maxLastActivityDiffMs;
  }

  static isSystemContractAddress(address: string) {
    return StateChangesDecoder.isSystemContractAddress(address);
  }
}
