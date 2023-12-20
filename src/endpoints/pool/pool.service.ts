import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { TxInPoolFields, TxPoolGatewayResponse } from "src/common/gateway/entities/transaction.pool";
import { TransactionType } from "../transactions/entities/transaction.type";
import { TransactionInPool } from "./entities/transaction.in.pool.dto";

@Injectable()
export class PoolService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
  ) { }

  async getTransactionFromPool(txHash: string): Promise<TransactionInPool | undefined> {
    const pool = await this.getEntirePool();
    const transaction = pool.find(tx => tx.txHash === txHash);

    return transaction;
  }

  async getPool(
    queryPagination: QueryPagination,
  ): Promise<TransactionInPool[]> {
    if (!this.apiConfigService.isTransactionPoolEnabled()) {
      return [];
    }

    const { from, size } = queryPagination;

    const pool = await this.getEntirePool();
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

  private parseTransactions(rawPool: TxPoolGatewayResponse): TransactionInPool[] {
    const transactionPool: TransactionInPool[] = [];
    // Check if 'txPool' property exists in the response
    if (rawPool && rawPool.txPool) {
      const txPool = rawPool.txPool;

      // Parse regular transactions
      if (txPool.regularTransactions && txPool.regularTransactions.length > 0) {
        for (const regularTx of txPool.regularTransactions) {
          const transaction = this.parseTransaction(regularTx.txFields, TransactionType.Transaction);
          transactionPool.push(transaction);
        }
      }

      // Parse smart contract results
      if (txPool.smartContractResults && txPool.smartContractResults.length > 0) {
        for (const scr of txPool.smartContractResults) {
          const transaction = this.parseTransaction(scr.txFields, TransactionType.SmartContractResult);
          transactionPool.push(transaction);
        }
      }

      // Parse rewards
      if (txPool.rewards && txPool.rewards.length > 0) {
        for (const rewardTx of txPool.rewards) {
          const transaction = this.parseTransaction(rewardTx.txFields, TransactionType.Reward);
          transactionPool.push(transaction);
        }
      }
    }

    return transactionPool;
  }

  private parseTransaction(tx: TxInPoolFields, type: TransactionType): TransactionInPool {
    return new TransactionInPool({
      txHash: tx.hash || '',
      sender: tx.sender || '',
      receiver: tx.receiver || '',
      nonce: tx.nonce || 0,
      value: tx.value || '',
      gasPrice: tx.gasprice || 0,
      gasLimit: tx.gaslimit || 0,
      data: tx.data || '',
      type: type || TransactionType.Transaction,
    });
  }
}
