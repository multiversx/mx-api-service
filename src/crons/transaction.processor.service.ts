import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { TransactionQuery } from "src/endpoints/transactions/entities/transaction.query";
import { TransactionService } from "src/endpoints/transactions/transaction.service";
import { ApiConfigService } from "src/helpers/api.config.service";
import { CachingService } from "src/helpers/caching.service";
import { GatewayService } from "src/helpers/gateway.service";
import { isSmartContractAddress } from "src/helpers/helpers";
import { EventsGateway } from "src/websockets/events.gateway";
import { ShardTransaction } from "./entities/shard.transaction";

@Injectable()
export class TransactionProcessorService {
  isProcessing: boolean = false;

  shards: number[] = [ 0, 1, 2, 4294967295 ];
  shardNonces: number[] = [ 0, 0, 0, 0 ];

  constructor(
      private readonly transactionService: TransactionService,
      private readonly cachingService: CachingService,
      private readonly eventsGateway: EventsGateway,
      private readonly gatewayService: GatewayService,
      private readonly apiConfigService: ApiConfigService
  ) {}

  @Cron('*/1 * * * * *')
  async handleCron() {
    let isCronActive = this.apiConfigService.getIsCronActive();
    if (!isCronActive) {
      return;
    }

    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      let newTransactions = await this.getNewTransactions();

      for (let transaction of newTransactions) {
        console.log(`Transferred ${transaction.value} from ${transaction.sender} to ${transaction.receiver}`);

        if (!isSmartContractAddress(transaction.sender)) {
          this.eventsGateway.onAccountBalanceChanged(transaction.sender);
        }

        if (!isSmartContractAddress(transaction.receiver)) {
          this.eventsGateway.onAccountBalanceChanged(transaction.receiver);
        }

        this.cachingService.tryInvalidateTransaction(transaction);
        this.cachingService.tryInvalidateTokens(transaction);
        this.cachingService.tryInvalidateTokensOnAccount(transaction);
        this.cachingService.tryInvalidateTokenBalance(transaction);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async getCurrentNonce(shardId: number): Promise<number> {
    let shardInfo = await this.gatewayService.get(`network/status/${shardId}`);
    return shardInfo.status.erd_nonce;
  }

  async getLastProcessedNonce(shardId: number): Promise<number | undefined> {
    return await this.cachingService.getCache<number>(`shardNonce:${shardId}`);
  }

  async setLastProcessedNonce(shardId: number, nonce: number): Promise<number> {
    return await this.cachingService.setCache<number>(`shardNonce:${shardId}`, nonce, Number.MAX_SAFE_INTEGER);
  }

  async getNewTransactions(): Promise<ShardTransaction[]> {
    let currentNonces = await Promise.all(
      this.shards.map(shard => this.getCurrentNonce(shard))
    );

    let lastProcessedNonces = await Promise.all(
      this.shards.map(shard => this.getLastProcessedNonce(shard))
    );

    let allTransactions: ShardTransaction[] = [];

    for (let [index, shardId] of this.shards.entries()) {
      let currentNonce = currentNonces[index];
      let lastProcessedNonce = lastProcessedNonces[index];

      // for the first time, we don't import all history, we start with the latest nonce
      if (!lastProcessedNonce) {
        this.setLastProcessedNonce(shardId, currentNonce);
        continue;
      }

      if (currentNonce <= lastProcessedNonce) {
        continue;
      }

      // maximum last 100 nonces, makes no sense to look too far behind
      if (currentNonce > lastProcessedNonce + 100) {
        lastProcessedNonce = currentNonce - 100;
      }

      // max 10 nonces at once to avoid overload
      if (currentNonce > lastProcessedNonce + 10) {
        currentNonce = lastProcessedNonce + 10;
      }

      for (let nonce = lastProcessedNonce + 1; nonce <= currentNonce; nonce++) {
        let transactions = await this.getShardTransactions(shardId, nonce);

        allTransactions = allTransactions.concat(...transactions);
      }

      this.setLastProcessedNonce(shardId, currentNonce);
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

  getShardsToRefresh(nonces: number[]): { shardId: number, nonce: number }[] {
    let result = [];
    
    for (let [index, nonce] of nonces.entries()) {
      if (nonce > this.shardNonces[index]) {
        result.push({ 
          shardId: this.shards[index],
          nonce
        });
      }
    }

    return result;
  }

  async getLastTimestamp() {
    let transactionQuery = new TransactionQuery();
    transactionQuery.size = 1;

    let transactions = await this.transactionService.getTransactions(transactionQuery);
    return transactions[0].timestamp;
  }

  async getTransactions(timestamp: number) {
    let transactionQuery = new TransactionQuery();
    transactionQuery.after = timestamp;
    transactionQuery.size = 1000;

    return await this.transactionService.getTransactions(transactionQuery);
  }
}