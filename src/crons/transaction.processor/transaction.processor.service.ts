import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { CacheInfo } from "src/utils/cache.info";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SftChangeTransactionExtractor } from "./extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "./extractor/transaction.extractor.interface";
import { TransferOwnershipExtractor } from "./extractor/transfer.ownership.extractor";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogMetricsEvent } from "src/common/entities/log.metrics.event";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { StakeFunction } from "src/endpoints/transactions/transaction-action/recognizers/staking/entities/stake.function";
import { ShardTransaction, TransactionProcessor } from "@multiversx/sdk-transaction-processor";

@Injectable()
export class TransactionProcessorService {
  private readonly logger = new OriginLogger(TransactionProcessorService.name);
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly nodeService: NodeService,
    private readonly eventEmitter: EventEmitter2,
  ) { }

  @Cron('*/1 * * * * *')
  async handleNewTransactions() {
    await this.transactionProcessor.start({
      gatewayUrl: this.apiConfigService.getGatewayUrl(),
      maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
      onTransactionsReceived: async (shard, nonce, transactions) => {
        const profiler = new PerformanceProfiler('Processing new transactions');

        this.logger.log(`New transactions: ${transactions.length} for shard ${shard} and nonce ${nonce}`);

        const allInvalidatedKeys = [];

        for (const transaction of transactions) {
          const invalidatedTokenProperties = await this.tryInvalidateTokenProperties(transaction);
          const invalidatedOwnerKeys = await this.tryInvalidateOwner(transaction);
          const invalidatedCollectionPropertiesKeys = await this.tryInvalidateCollectionProperties(transaction);
          const invalidatedStakeTopUpKey = await this.tryInvalidateStakeTopup(transaction);

          allInvalidatedKeys.push(
            ...invalidatedTokenProperties,
            ...invalidatedOwnerKeys,
            ...invalidatedCollectionPropertiesKeys,
            ...invalidatedStakeTopUpKey,
          );
        }

        const uniqueInvalidatedKeys = allInvalidatedKeys.distinct();
        if (uniqueInvalidatedKeys.length > 0) {
          this.clientProxy.emit('deleteCacheKeys', uniqueInvalidatedKeys);
        }

        const distinctSendersAndReceivers = transactions.selectMany(transaction => [transaction.sender, transaction.receiver]).distinct();
        const txCountInvalidationKeys = distinctSendersAndReceivers.map(address => CacheInfo.TxCount(address).key);
        await this.cachingService.batchDelCache(txCountInvalidationKeys);

        profiler.stop();
      },
      getLastProcessedNonce: async (shardId) => {
        return await this.cachingService.get<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key);
      },
      setLastProcessedNonce: async (shardId, nonce) => {
        const event = new LogMetricsEvent();
        event.args = [shardId, nonce];
        this.eventEmitter.emit(
          MetricsEvents.SetLastProcessedNonce,
          event
        );

        await this.cachingService.set<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key, nonce, CacheInfo.TransactionProcessorShardNonce(shardId).ttl);
      },
    });
  }

  private async tryInvalidateTokenProperties(transaction: ShardTransaction): Promise<string[]> {
    if (transaction.receiver !== this.apiConfigService.getEsdtContractAddress()) {
      return [];
    }

    const transactionFuncName = transaction.getDataFunctionName();

    if (transactionFuncName === 'controlChanges') {
      const args = transaction.getDataArgs();
      if (args && args.length > 0) {
        const tokenIdentifier = BinaryUtils.hexToString(args[0]);
        this.logger.log(`Invalidating token properties for token ${tokenIdentifier}`);
        return await this.cachingService.deleteInCache(`tokenProperties:${tokenIdentifier}`);
      }
    }

    return [];
  }

  async tryInvalidateOwner(transaction: ShardTransaction): Promise<string[]> {
    const transactionFuncName = transaction.getDataFunctionName();
    if (transactionFuncName !== 'mergeValidatorToDelegationWithWhitelist' && transactionFuncName !== 'makeNewContractFromValidatorData') {
      return [];
    }

    return await this.nodeService.deleteOwnersForAddressInCache(transaction.sender);
  }

  async tryInvalidateCollectionProperties(transaction: ShardTransaction): Promise<string[]> {
    if (!transaction.data) {
      return [];
    }

    const tryExtractSftChange = new SftChangeTransactionExtractor();
    const collectionIdentifier = tryExtractSftChange.extract(transaction);
    if (!collectionIdentifier) {
      return [];
    }

    const tryExtractTransferOwnership: TransactionExtractorInterface<{ identifier: string; }> = new TransferOwnershipExtractor();
    const metadataTransferOwnership = tryExtractTransferOwnership.extract(transaction);
    if (metadataTransferOwnership) {
      this.logger.log(`Detected NFT Transfer ownership for collection with identifier '${metadataTransferOwnership.identifier}'`);
      const key = CacheInfo.EsdtProperties(collectionIdentifier).key;
      await this.cachingService.deleteInCache(key);

      return [key];
    }

    return [];
  }

  async tryInvalidateStakeTopup(transaction: ShardTransaction): Promise<string[]> {
    if (!transaction.data) {
      return [];
    }

    const transactionFuncName = transaction.getDataFunctionName();
    if (!transactionFuncName) {
      return [];
    }

    if (!transactionFuncName.in(StakeFunction.delegate, StakeFunction.unDelegate, StakeFunction.reDelegateRewards)) {
      return [];
    }

    await this.cachingService.deleteInCache(CacheInfo.StakeTopup(transaction.receiver).key);

    return [CacheInfo.StakeTopup(transaction.receiver).key];
  }
}
