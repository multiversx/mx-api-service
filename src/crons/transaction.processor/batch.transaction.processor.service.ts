import { CachingService } from "@elrondnetwork/erdnest";
import { LogTopic, ShardTransaction, TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { BatchTransactionStatus } from "src/endpoints/transactions.batch/entities/batch.transaction.status";
import { TransactionBatch } from "src/endpoints/transactions.batch/entities/transaction.batch";
import { TransactionBatchStatus } from "src/endpoints/transactions.batch/entities/transaction.batch.status";
import { TransactionsBatchService } from "src/endpoints/transactions.batch/transactions.batch.service";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { CacheInfo } from "src/utils/cache.info";

@Injectable()
export class BatchTransactionProcessorService {
  private isRunnningHandleNewTransactions: boolean = false;
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();
  private readonly logger: Logger;

  constructor(
    private readonly apiConfigService: ApiConfigService,
    private readonly cachingService: CachingService,
    private readonly transactionsBatchService: TransactionsBatchService,
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly transactionService: TransactionService
  ) {
    this.logger = new Logger(BatchTransactionProcessorService.name);
  }

  @Cron('* * * * *')
  async handleDroppedTransactions() {
    const keys: string[] = await this.cachingService.getKeys(CacheInfo.PendingTransaction('*').key);

    const pendingTransactionsCached: string[] = await this.cachingService.batchGetCacheRemote(keys);

    const pendingTransactions: { [key: string]: { batchId: string, address: string, date: Date } } = {};
    for (const [index, key] of keys.entries()) {
      const newKey = key.replace('pendingtransaction:', '');
      if (!pendingTransactionsCached[index]) {
        continue;
      }

      const components = pendingTransactionsCached[index].split(';');

      pendingTransactions[newKey] = {
        batchId: components[0],
        address: components.length > 1 ? components[1] : '',
        date: components.length > 2 ? new Date(components[2]) : new Date('2021-01-01'),
      };
    }


    if (Object.keys(pendingTransactions).length === 0) {
      return;
    }

    const processedTransactions: { batchId: string, hash: string, address: string }[] = [];

    for (const hash of Object.keys(pendingTransactions)) {
      const date = pendingTransactions[hash].date;
      const differenceInMilliseconds = new Date().getTime() - date.getTime();
      const differenceInMinutes = differenceInMilliseconds / 1000 / 60;
      if (differenceInMinutes <= 10) {
        continue;
      }

      this.logger.log(`DroppedTransactions: found transaction with hash '${hash}' older than 10 minutes (${date.toISOString()})`);

      try {
        const transaction = await this.transactionService.getTransaction(hash);
        if (!transaction) {
          const batchId = pendingTransactions[hash].batchId;
          const address = pendingTransactions[hash].address;
          this.logger.log(`DroppedTransactions: transaction with hash '${hash}' and batchId '${batchId}', address '${address}' could not be found. Dropping`);

          const batch: TransactionBatch | undefined = await this.cachingService.getCacheRemote(
            CacheInfo.TransactionBatch(address, batchId).key
          );
          if (batch) {
            this.logger.log(`DroppedTransactions: found batch with id '${batchId}'`);
            for (const group of batch.groups) {
              for (const item of group.items) {
                if (item.transaction.hash === hash && item.status === BatchTransactionStatus.pending) {
                  item.status = BatchTransactionStatus.dropped;
                  batch.status = TransactionBatchStatus.dropped;
                  await this.cachingService.setCacheRemote(
                    CacheInfo.TransactionBatch(address, batchId).key,
                    batch,
                    CacheInfo.TransactionBatch(address, batchId).ttl
                  );

                  await this.cachingService.deleteInCache(CacheInfo.PendingTransaction(hash).key);

                  processedTransactions.push({ batchId, hash, address });
                  this.logger.log(`DroppedTransactions: found pending transaction with hash '${hash}' in batch with id '${batchId}' for address '${address}'`);
                }
              }
            }
          }
        }
      } catch (error: any) {
        this.logger.error(`Unexpected error when getting tx for hash: ${hash}`);
        this.logger.error(error);
      }
    }

    const groupedByBatchId = processedTransactions.groupBy(x => x.batchId);
    for (const batchId of Object.keys(groupedByBatchId)) {
      const transactionInfos = groupedByBatchId[batchId];

      const txHashes = transactionInfos.map((x: any) => x.hash);
      const address = transactionInfos[0].address;

      this.clientProxy.emit('onBatchUpdated', { address, batchId, txHashes });
      this.logger.log(`DroppedTransactions: transaction with hashes '${txHashes}' and batchId '${batchId}', address '${address}' finished emitting onBatchUpdated event`);
    }
  }

  @Cron('*/1 * * * * *')
  async handleNewTransactions() {
    if (this.isRunnningHandleNewTransactions) {
      return;
    }

    this.isRunnningHandleNewTransactions = true;

    try {
      await this.transactionProcessor.start({
        gatewayUrl: this.apiConfigService.getGatewayUrl(),
        maxLookBehind: this.apiConfigService.getTransactionBatchMaxLookBehind(),
        waitForFinalizedCrossShardSmartContractResults: true,
        onMessageLogged: (topic, message) => {
          if (topic === LogTopic.CrossShardSmartContractResult) {
            this.logger.log(`${LogTopic.CrossShardSmartContractResult}: ${message}`);
          }
        },
        // eslint-disable-next-line require-await
        onTransactionsReceived: async (shardId, nonce, transactions, statistics) => {
          this.logger.log(`Received ${transactions.length} transactions on shard ${shardId} and nonce ${nonce}. Time left: ${statistics.secondsLeft}`);

          for (const transaction of transactions) {
            this.logger.log(`Transaction with hash ${transaction.hash} completed`);
          }

          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          this.handleTransactionBatches(transactions);
        },
        getLastProcessedNonce: async (shardId) => {
          return await this.cachingService.getCacheRemote(CacheInfo.TransactionBatchShardNonce(shardId).key);
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          await this.cachingService.setCacheRemote(CacheInfo.TransactionBatchShardNonce(shardId).key, nonce, CacheInfo.TransactionBatchShardNonce(shardId).ttl);
        },
      });
    } catch (error) {
      this.logger.error('Unhandled exception while processing transactions');
      this.logger.error(error);
    } finally {
      this.isRunnningHandleNewTransactions = false;
    }
  }

  private async handleTransactionBatches(transactions: ShardTransaction[]): Promise<void> {
    const transactionsIndexed: { [key: string]: ShardTransaction } = {};
    for (const transaction of transactions) {
      transactionsIndexed[transaction.hash] = transaction;
    }

    const processedTransactions: { batchId: string, hash: string, address: string }[] = [];

    const keys = transactions.map(transaction => CacheInfo.PendingTransaction(transaction.hash).key);

    const pendingTransactionsCached: string[] = await this.cachingService.batchGetCacheRemote<string>(keys);

    const pendingTransactions: { [key: string]: { batchId: string, address: string, date: Date } } = {};
    for (const [index, key] of keys.entries()) {
      const newKey = key.replace('pendingtransaction:', '');
      if (!pendingTransactionsCached[index]) {
        continue;
      }

      const components = pendingTransactionsCached[index].split(';');

      pendingTransactions[newKey] = {
        batchId: components[0],
        address: components.length > 1 ? components[1] : '',
        date: components.length > 2 ? new Date(components[2]) : new Date('2021-01-01'),
      };
    }

    for (const hash of Object.keys(pendingTransactions)) {
      const transaction = transactionsIndexed[hash];
      if (!transaction) {
        continue;
      }

      // @ts-ignore
      const transactionStatus: TransactionStatus = transaction.status;
      const batchId = pendingTransactions[hash].batchId;

      await this.processTransaction(hash, batchId, transaction.sender, transactionStatus);

      processedTransactions.push({ batchId, hash, address: transaction.sender });
    }

    const groupedByBatchId = processedTransactions.groupBy(x => x.batchId);
    for (const batchId of Object.keys(groupedByBatchId)) {
      const transactionInfos = groupedByBatchId[batchId];

      const txHashes = transactionInfos.map((x: any) => x.hash);
      const address = transactionInfos[0].address;

      this.clientProxy.emit('onBatchUpdated', { address, batchId, txHashes });
    }
  }

  private async processTransaction(txHash: string, batchId: string, address: string, status: BatchTransactionStatus): Promise<any> {
    this.logger.log(`Processing transaction with hash '${txHash}', batch '${batchId}', address '${address}', status '${status}'`);

    try {
      const batch: TransactionBatch | undefined = await this.cachingService.getCacheRemote(CacheInfo.TransactionBatch(address, batchId).key);
      if (!batch) {
        this.logger.error(`Could not find batch with id '${batchId}' when processing transaction with hash '${txHash}'`);
        return;
      }

      for (const [index, group] of batch.groups.entries()) {
        for (const item of group.items) {
          if (item.transaction.hash === txHash) {
            item.status = status;

            // if transaction batch status is pending only
            // e.g. if it's invalid, we only update the transaction status
            // this is to prevent an invalid batch to become successful
            if (batch.status === TransactionBatchStatus.pending) {
              // when the transaction is invalid, the batch status becomes invalid
              if (status === BatchTransactionStatus.invalid) {
                batch.status = TransactionBatchStatus.invalid;
              } else if (status === BatchTransactionStatus.success) {
                if (group.items.every((item: any) => item.status === BatchTransactionStatus.success)) {
                  if (index + 1 >= batch.groups.length) {
                    this.logger.log(`Marking batch with id '${batch.id}' as success`);
                    batch.status = TransactionBatchStatus.success;
                  } else {
                    const nextGroup = batch.groups[index + 1];

                    this.logger.log(`Starting group with index ${index + 1} for batch with id '${batch.id}'`);
                    await this.transactionsBatchService.startTransactionGroup(batch, nextGroup);

                    const invalidResults = nextGroup.items.filter((x: any) => x.status === BatchTransactionStatus.invalid);
                    if (invalidResults.length > 0) {
                      const address = TransactionBatch.getAddress(batch);
                      const txHashes = invalidResults.map((x: any) => x.transaction.hash);
                      this.logger.log(`Encountered failed transactions for batch with id '${batch.id}', tx hashes: ${txHashes}. Aborting`);

                      batch.status = TransactionBatchStatus.invalid;
                      this.clientProxy.emit('onBatchUpdated', { address, batchId, txHashes });
                    }
                  }
                }
              }
            }

            await this.cachingService.setCacheRemote(
              CacheInfo.TransactionBatch(address, batchId).key,
              batch,
              CacheInfo.TransactionBatch(address, batchId).ttl
            );
          }
        }
      }
    } finally {
      await this.cachingService.deleteInCache(CacheInfo.PendingTransaction(txHash).key);
    }
  }
}
