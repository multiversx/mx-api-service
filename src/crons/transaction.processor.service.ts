import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { MetricsService } from "src/endpoints/metrics/metrics.service";
import { ShardService } from "src/endpoints/shards/shard.service";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { GatewayService } from "src/helpers/gateway.service";
import { isSmartContractAddress } from "src/helpers/helpers";
import { PerformanceProfiler } from "src/helpers/performance.profiler";
import { EventsGateway } from "src/websockets/events.gateway";
import { ShardTransaction } from "./entities/shard.transaction";

@Injectable()
export class TransactionProcessorService {
  isProcessing: boolean = false;
  private readonly logger: Logger;

  constructor(
      private readonly transactionService: TransactionService,
      private readonly cachingService: CachingService,
      private readonly eventsGateway: EventsGateway,
      private readonly gatewayService: GatewayService,
      private readonly apiConfigService: ApiConfigService,
      private readonly metricsService: MetricsService,
      @Inject('PUBSUB_SERVICE') private client: ClientProxy,
      private readonly shardService: ShardService,
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

    this.isProcessing = true;
    try {
      let profiler = new PerformanceProfiler('Getting new transactions');
      let newTransactions = await this.getNewTransactions();
      profiler.stop();
      if (newTransactions.length === 0) {
        return;
      }

      profiler = new PerformanceProfiler('Processing new transactions');

      this.logger.log(`New transactions: ${newTransactions.length}`);

      let allInvalidatedKeys = [];

      for (let transaction of newTransactions) {
        // this.logger.log(`Transferred ${transaction.value} from ${transaction.sender} to ${transaction.receiver}`);

        if (!isSmartContractAddress(transaction.sender)) {
          this.eventsGateway.onAccountBalanceChanged(transaction.sender);
        }

        if (!isSmartContractAddress(transaction.receiver)) {
          this.eventsGateway.onAccountBalanceChanged(transaction.receiver);
        }
        
        let invalidatedTransactionKeys = await this.cachingService.tryInvalidateTransaction(transaction);
        let invalidatedTokenKeys = await this.cachingService.tryInvalidateTokens(transaction);
        let invalidatedTokenProperties = await this.cachingService.tryInvalidateTokenProperties(transaction);
        let invalidatedTokensOnAccountKeys = await this.cachingService.tryInvalidateTokensOnAccount(transaction);
        let invalidatedTokenBalancesKeys = await this.cachingService.tryInvalidateTokenBalance(transaction);

        allInvalidatedKeys.push(
          ...invalidatedTransactionKeys, 
          ...invalidatedTokenKeys, 
          ...invalidatedTokenProperties,
          ...invalidatedTokensOnAccountKeys, 
          ...invalidatedTokenBalancesKeys,
        );
      }

      let uniqueInvalidatedKeys = [...new Set(allInvalidatedKeys)];
      if (uniqueInvalidatedKeys.length > 0) {
        this.client.emit('deleteCacheKeys', uniqueInvalidatedKeys);
      }

      profiler.stop();
    } finally {
      this.isProcessing = false;
    }
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