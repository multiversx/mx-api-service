import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { MetricsService } from "src/common/metrics/metrics.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CachingService } from "src/common/caching/caching.service";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ShardTransaction, TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftWorkerService } from "src/queue.worker/nft.worker/nft.worker.service";
import { ProcessNftSettings } from "src/endpoints/process-nfts/entities/process.nft.settings";
import { NftUpdateAttributesTransactionExtractor as NftUpdateAttributesTransactionExtractor } from "./extractor/nft.update.attributes.transaction.extractor";
import { SftChangeTransactionExtractor } from "./extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "./extractor/transaction.extractor.interface";
import { TransferOwnershipExtractor } from "./extractor/transfer.ownership.extractor";

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
    private readonly nftWorkerService: NftWorkerService,
    private readonly nftService: NftService,
    // private readonly nftExtendedAttributesService: NftExtendedAttributesService,
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
          if (this.apiConfigService.getIsProcessNftsFlagActive()) {
            const nftUpdateAttributesResult = new NftUpdateAttributesTransactionExtractor().extract(transaction);
            if (nftUpdateAttributesResult) {
              this.logger.log(`Detected NFT update attributes for NFT with identifier '${nftUpdateAttributesResult.identifier}' and tx hash '${transaction.hash}'`);
              // eslint-disable-next-line @typescript-eslint/no-floating-promises
              this.tryHandleNftUpdateMetadata(transaction, nftUpdateAttributesResult.identifier);
            }
          }

          const invalidatedTokenProperties = await this.cachingService.tryInvalidateTokenProperties(transaction);
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

  private async tryHandleNftUpdateMetadata(transaction: ShardTransaction, identifier: string) {
    try {
      const nft = await this.nftService.getSingleNft(identifier);
      if (!nft) {
        this.logger.error(`NFT update metadata: could not fetch nft details for NFT with identifier '${identifier}' and transaction hash '${transaction.hash}'`);
        return;
      }

      const processSettings = new ProcessNftSettings();
      processSettings.forceRefreshMetadata = true;
      await this.nftWorkerService.addProcessNftQueueJob(nft, processSettings);
    } catch (error) {
      this.logger.error(`Unexpected error when handling NFT update metadata for transaction with hash '${transaction.hash}'`);
      this.logger.error(error);
    }
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
