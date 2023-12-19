import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { TransactionInPool } from "src/common/gateway/entities/transaction.pool";
import { TransactionType } from "../transactions/entities/transaction.type";

@Injectable()
export class PoolService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
  ) { }

  async getPool(
    pagination: QueryPagination,
  ): Promise<TransactionInPool[]> {
    if (!this.apiConfigService.isTransactionPoolEnabled()) {
      return [];
    }

    const { from, size } = pagination;

    const pool = await this.getEntirePool();
    console.log(pool);
    return pool.slice(from, from + size);
  }

  async getEntirePool(): Promise<TransactionInPool[]> {
    return await this.cacheService.getOrSet(
      CacheInfo.TransactionPool.key,
      async () => await this.getTxPoolRaw(),
      CacheInfo.TransactionPool.ttl
    );
  }

  async getTxPoolRaw(): Promise<TransactionInPool[]> {
    const pool = await this.gatewayService.getTransactionPool();
    return this.parseTransactions(pool);
  }

  private parseTransactions(rawPool: any): TransactionInPool[] {
    const transactionPool: TransactionInPool[] = [];
    // Check if 'txPool' property exists in the response
    if (rawPool && rawPool.txPool) {
      const txPool = rawPool.txPool;

      // Parse regular transactions
      if (txPool.regularTransactions && txPool.regularTransactions.length > 0) {
        txPool.regularTransactions.forEach((tx: any) => {
          const transaction = this.parseTransaction(tx, TransactionType.Transaction);
          transactionPool.push(transaction);
        });
      }

      // Parse smart contract results
      if (txPool.smartContractResults && txPool.smartContractResults.length > 0) {
        txPool.smartContractResults.forEach((tx: any) => {
          const transaction = this.parseTransaction(tx, TransactionType.SmartContractResult);
          transactionPool.push(transaction);
        });
      }

      // Parse rewards
      if (txPool.rewards && txPool.rewards.length > 0) {
        txPool.rewards.forEach((reward: any) => {
          const transaction = this.parseTransaction(reward.txFields, TransactionType.Reward);
          transactionPool.push(transaction);
        });
      }
    }

    return transactionPool;
  }

  private parseTransaction(tx: any, type: TransactionType): TransactionInPool {
    return new TransactionInPool({
      hash: tx.hash || '',
      sender: tx.sender || '',
      receiver: tx.receiver || '',
      nonce: tx.nonce || 0,
      value: tx.value || 0,
      gasprice: tx.gasprice || 0,
      gaslimit: tx.gaslimit || 0,
      data: tx.data || '',
      type: type,
    });
  }
}
