import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { ShardService } from "src/endpoints/shards/shard.service";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { ApiConfigService } from "src/common/api.config.service";
import { CachingService } from "src/common/caching.service";
import { GatewayService } from "src/common/gateway.service";
import { AddressUtils } from "src/utils/address.utils";
import { PerformanceProfiler } from "src/utils/performance.profiler";
import { EventsGateway } from "src/websockets/events.gateway";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ShardTransaction, TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { Constants } from "src/utils/constants";

@Injectable()
export class TransactionProcessorService {
  isProcessing: boolean = false;
  private readonly logger: Logger;
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
      private readonly transactionService: TransactionService,
      private readonly cachingService: CachingService,
      private readonly eventsGateway: EventsGateway,
      private readonly gatewayService: GatewayService,
      private readonly apiConfigService: ApiConfigService,
      private readonly metricsService: MetricsService,
      @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
      private readonly shardService: ShardService,
      private readonly nodeService: NodeService,
  ) {
    this.logger = new Logger(TransactionProcessorService.name);
  }

  @Cron('*/1 * * * * *')
  async handleNewTransactions() {
    let isCronActive = this.apiConfigService.getIsTransactionProcessorCronActive();
    if (!isCronActive) {
      return;
    }

    if (this.isProcessing) {
      return;
    }

    try {
      await this.transactionProcessor.start({
        gatewayUrl: this.apiConfigService.getGatewayUrl(),
        maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
        notifyEmptyBlocks: true,
        onTransactionsReceived: async (shard, __, transactions, ___, blockHash) => {
          let totalGasUsed = transactions.map(x => x.gasLimit ?? 0).reduce((a, b) => a + b, 0);
          await this.cachingService.setCache(`blockGasUsed:${shard}:${blockHash}`, totalGasUsed, Constants.oneWeek());

          transactions = transactions.filter(x => x.destinationShard === shard);
          if (transactions.length === 0) {
            return;
          }
    
          let profiler = new PerformanceProfiler('Processing new transactions');
    
          this.logger.log(`New transactions: ${transactions.length}`);
    
          let allInvalidatedKeys = [];
    
          for (let transaction of transactions) {
            // this.logger.log(`Transferred ${transaction.value} from ${transaction.sender} to ${transaction.receiver}`);
    
            if (!AddressUtils.isSmartContractAddress(transaction.sender)) {
              this.eventsGateway.onAccountBalanceChanged(transaction.sender);
            }
    
            if (!AddressUtils.isSmartContractAddress(transaction.receiver)) {
              this.eventsGateway.onAccountBalanceChanged(transaction.receiver);
            }
            
            let invalidatedTransactionKeys = await this.cachingService.tryInvalidateTransaction(transaction);
            let invalidatedTokenKeys = await this.cachingService.tryInvalidateTokens(transaction);
            let invalidatedTokenProperties = await this.cachingService.tryInvalidateTokenProperties(transaction);
            let invalidatedTokensOnAccountKeys = await this.cachingService.tryInvalidateTokensOnAccount(transaction);
            let invalidatedTokenBalancesKeys = await this.cachingService.tryInvalidateTokenBalance(transaction);
            let invalidatedOwnerKeys = await this.tryInvalidateOwner(transaction);
    
            allInvalidatedKeys.push(
              ...invalidatedTransactionKeys, 
              ...invalidatedTokenKeys, 
              ...invalidatedTokenProperties,
              ...invalidatedTokensOnAccountKeys, 
              ...invalidatedTokenBalancesKeys,
              ...invalidatedOwnerKeys
            );
          }
    
          let uniqueInvalidatedKeys = [...new Set(allInvalidatedKeys)];
          if (uniqueInvalidatedKeys.length > 0) {
            this.clientProxy.emit('deleteCacheKeys', uniqueInvalidatedKeys);
          }
    
          profiler.stop();
        },
        getLastProcessedNonce: async (shardId) => {
          return await this.shardService.getLastProcessedNonce(shardId);
        },
        setLastProcessedNonce: async (shardId, nonce) => {
          await this.shardService.setLastProcessedNonce(shardId, nonce);
        }
      });
    } finally {
      this.isProcessing = false;
    }
  }

  async tryInvalidateOwner(transaction: ShardTransaction): Promise<string[]> {
    let transactionFuncName = transaction.getDataFunctionName();
    if (transactionFuncName !== 'mergeValidatorToDelegationWithWhitelist') {
      return [];
    }

    return await this.nodeService.deleteOwnersForAddressInCache(transaction.sender);
  }

  async getNewTransactions(): Promise<ShardTransaction[]> {
    let currentNonces = await this.shardService.getCurrentNonces();
    let lastProcessedNonces = await this.shardService.getLastProcessedNonces();

    for (let [index, shardId] of this.shardService.shards.entries()) {
      let lastProcessedNonce = lastProcessedNonces[index];
      if (!lastProcessedNonce) {
        continue;
      }

      this.metricsService.setLastProcessedNonce(shardId, lastProcessedNonce);
    }

    let allTransactions: ShardTransaction[] = [];

    for (let [index, shardId] of this.shardService.shards.entries()) {
      let currentNonce = currentNonces[index];
      let lastProcessedNonce = lastProcessedNonces[index];

      // for the first time, we don't import all history, we start with the latest nonce
      if (!lastProcessedNonce) {
        this.shardService.setLastProcessedNonce(shardId, currentNonce);
        continue;
      }

      if (currentNonce === lastProcessedNonce) {
        continue;
      }

      // current nonce less than last processed means that testnet has been probably reset
      // and that means we will set the last processed nonce as the current nonce
      if (currentNonce < lastProcessedNonce) {
        this.shardService.setLastProcessedNonce(shardId, currentNonce);
      }

      // maximum last number of nonces, makes no sense to look too far behind
      let maxLookBehind = this.apiConfigService.getTransactionProcessorMaxLookBehind();
      if (currentNonce > lastProcessedNonce + maxLookBehind) {
        lastProcessedNonce = currentNonce - maxLookBehind;
      }

      // max 10 nonces at once to avoid overload
      if (currentNonce > lastProcessedNonce + 10) {
        currentNonce = lastProcessedNonce + 10;
      }

      for (let nonce = lastProcessedNonce + 1; nonce <= currentNonce; nonce++) {
        let transactions = await this.getShardTransactions(shardId, nonce);

        allTransactions = allTransactions.concat(...transactions);
      }

      this.logger.log(`Processed nonce ${currentNonce} on shard ${shardId}`);

      this.shardService.setLastProcessedNonce(shardId, currentNonce);
    }

    return allTransactions;
  }

  async getShardTransactions(shardId: number, nonce: number): Promise<ShardTransaction[]> {
    let result = await this.gatewayService.get(`block/${shardId}/by-nonce/${nonce}?withTxs=true`);

    if (result.block.miniBlocks === undefined) {
      return [];
    }

    let transactions: ShardTransaction[] = result.block.miniBlocks
      .selectMany((x: any) => x.transactions)
      .map((item: any) => {
        let transaction = new ShardTransaction();
        transaction.data = item.data;
        transaction.sender = item.sender;
        transaction.receiver = item.receiver;
        transaction.sourceShard = item.sourceShard;
        transaction.destinationShard = item.destinationShard;
        transaction.hash = item.hash;
        transaction.nonce = item.nonce;
        transaction.status = item.status;
        transaction.value = item.value;

        return transaction;
      });

    // we only care about transactions that are finalized on the destinationShard
    return transactions.filter(x => x.destinationShard === shardId);
  }

  async getLastTimestamp() {
    let transactionQuery = new TransactionFilter();
    transactionQuery.size = 1;

    let transactions = await this.transactionService.getTransactions(transactionQuery);
    return transactions[0].timestamp;
  }

  async getTransactions(timestamp: number) {
    let transactionQuery = new TransactionFilter();
    transactionQuery.after = timestamp;
    transactionQuery.size = 1000;

    return await this.transactionService.getTransactions(transactionQuery);
  }
}