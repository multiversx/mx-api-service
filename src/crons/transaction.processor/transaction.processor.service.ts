import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ShardTransaction, TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { SftChangeTransactionExtractor } from "./extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "./extractor/transaction.extractor.interface";
import { TransferOwnershipExtractor } from "./extractor/transfer.ownership.extractor";
import { PerformanceProfiler, CachingService, BinaryUtils } from "@elrondnetwork/nestjs-microservice-common";

@Injectable()
export class TransactionProcessorService {
  private readonly logger: Logger;
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
    private readonly cachingService: CachingService,
    private readonly apiConfigService: ApiConfigService,
    private readonly metricsService: MetricsService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly nodeService: NodeService,
  ) {
    this.logger = new Logger(TransactionProcessorService.name);
  }

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

          allInvalidatedKeys.push(
            ...invalidatedTokenProperties,
            ...invalidatedOwnerKeys,
            ...invalidatedCollectionPropertiesKeys
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
        return await this.cachingService.getCache<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key);
      },
      setLastProcessedNonce: async (shardId, nonce) => {
        this.metricsService.setLastProcessedNonce(shardId, nonce);
        await this.cachingService.setCache<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key, nonce, CacheInfo.TransactionProcessorShardNonce(shardId).ttl);
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
    if (transactionFuncName !== 'mergeValidatorToDelegationWithWhitelist') {
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

    const tryExtractTransferOwnership: TransactionExtractorInterface<{ identifier: string }> = new TransferOwnershipExtractor();
    const metadataTransferOwnership = tryExtractTransferOwnership.extract(transaction);
    if (metadataTransferOwnership) {
      this.logger.log(`Detected NFT Transfer ownership for collection with identifier '${metadataTransferOwnership.identifier}'`);
      const key = CacheInfo.EsdtProperties(collectionIdentifier).key;
      await this.cachingService.deleteInCache(key);

      return [key];
    }

    return [];
  }
}
