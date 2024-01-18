import { Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { CacheInfo } from "src/utils/cache.info";
import { TxPoolGatewayResponse } from "src/common/gateway/entities/tx.pool.gateway.response";
import { TransactionType } from "../transactions/entities/transaction.type";
import { TransactionInPool } from "./entities/transaction.in.pool.dto";
import { PoolFilter } from "./entities/pool.filter";
import { TxInPoolFields } from "src/common/gateway/entities/tx.in.pool.fields";

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

  async getPoolCount(filter: PoolFilter): Promise<number> {
    const pool = await this.getEntirePool();
    return this.applyFilters(pool, filter).length;
  }

  async getPool(
    queryPagination: QueryPagination,
    filter: PoolFilter,
  ): Promise<TransactionInPool[]> {
    if (!this.apiConfigService.isTransactionPoolEnabled()) {
      return [];
    }

    const { from, size } = queryPagination;
    const entirePool = await this.getEntirePool();
    const pool = this.applyFilters(entirePool, filter);
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
    if (rawPool && rawPool.txPool) {
      transactionPool.push(...this.processTransactionType(rawPool.txPool.regularTransactions ?? [], TransactionType.Transaction));
      transactionPool.push(...this.processTransactionType(rawPool.txPool.smartContractResults ?? [], TransactionType.SmartContractResult));
      transactionPool.push(...this.processTransactionType(rawPool.txPool.rewards ?? [], TransactionType.Reward));
    }

    return transactionPool;
  }

  private processTransactionType(transactions: any[], transactionType: TransactionType): TransactionInPool[] {
    return transactions.map(tx => this.parseTransaction(tx.txFields, transactionType));
  }

  private parseTransaction(tx: TxInPoolFields, type: TransactionType): TransactionInPool {
    return new TransactionInPool({
      txHash: tx.hash ?? '',
      sender: tx.sender ?? '',
      receiver: tx.receiver ?? '',
      nonce: tx.nonce ?? 0,
      value: tx.value ?? '',
      gasPrice: tx.gasprice ?? 0,
      gasLimit: tx.gaslimit ?? 0,
      data: tx.data ?? '',
      type: type ?? TransactionType.Transaction,
    });
  }

  private applyFilters(pool: TransactionInPool[], filters: PoolFilter): TransactionInPool[] {
    return pool.filter((transaction) => {
      return (
        (!filters.sender || transaction.sender === filters.sender) &&
        (!filters.receiver || transaction.receiver === filters.receiver) &&
        (!filters.type || transaction.type === filters.type)
      );
    });
  }
}
