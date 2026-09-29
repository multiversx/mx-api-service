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
import { TransactionActionService } from "../transactions/transaction-action/transaction.action.service";
import { Transaction } from "../transactions/entities/transaction";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";

@Injectable()
export class PoolService {
  constructor(
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly cacheService: CacheService,
    private readonly transactionActionService: TransactionActionService,
  ) { }

  // undefined when the transaction is not in the pool, null when the pool is too large to be read
  async getTransactionFromPool(txHash: string): Promise<TransactionInPool | undefined | null> {
    const pool = await this.getPoolWithFilters();
    if (pool === null) {
      return null;
    }

    return pool.find(tx => tx.txHash === txHash);
  }

  // null when the count needs the pool and the pool is too large to be read
  async getPoolCount(filter: PoolFilter): Promise<number | null> {
    const { type, ...otherFilters } = filter;
    if (Object.values(otherFilters).some(value => value !== undefined)) {
      const pool = await this.getPoolWithFilters(filter);
      return pool === null ? null : pool.length;
    }

    // the total and the count for each type are cached on their own
    return await this.cacheService.getOrSet(
      CacheInfo.TransactionPoolCount(type).key,
      async () => await this.getPoolCountRaw(type),
      CacheInfo.TransactionPoolCount(type).ttl,
    );
  }

  // the gateway counts the pool itself, so the total needs neither the pool nor its size limit. counts by
  // type are taken from the pool
  async getPoolCountRaw(type?: TransactionType): Promise<number | null> {
    if (type === undefined) {
      return await this.gatewayService.getTransactionPoolCount();
    }

    const pool = await this.getPoolWithFilters(new PoolFilter({ type }));
    return pool === null ? null : pool.length;
  }

  // null when the pool is too large to be read
  async getPool(
    queryPagination: QueryPagination,
    filter?: PoolFilter,
  ): Promise<TransactionInPool[] | null> {
    if (!this.apiConfigService.isTransactionPoolEnabled()) {
      return [];
    }

    const { from, size } = queryPagination;
    const pool = await this.getPoolWithFilters(filter);
    if (pool === null) {
      return null;
    }

    return pool.slice(from, from + size);
  }

  // null when the pool is too large to be read
  async getPoolWithFilters(
    filter?: PoolFilter,
  ): Promise<TransactionInPool[] | null> {
    const pool = await this.cacheService.getOrSet(
      CacheInfo.TransactionPool.key,
      async () => await this.getTxPoolRaw(),
      CacheInfo.TransactionPool.ttl,
      CacheInfo.TransactionPool.ttl,
      true, // cacheNullable: null stands for a pool too large to be read, see getTxPoolRaw
    );

    if (pool === null) {
      return null;
    }

    return this.applyFilters(pool, filter);
  }

  // null only when the pool is too large to be read. it is cached like the pool itself, so that until it
  // expires the pool is not downloaded again, up to the size limit, on every request
  async getTxPoolRaw(): Promise<TransactionInPool[] | null> {
    const pool = await this.gatewayService.getTransactionPool();
    if (!pool) {
      return null;
    }

    return this.parseTransactions(pool);
  }

  private async parseTransactions(rawPool: TxPoolGatewayResponse): Promise<TransactionInPool[]> {
    const transactionPool: TransactionInPool[] = [];

    if (rawPool?.txPool) {
      const regularTransactions = this.processTransactionsWithType(rawPool.txPool.regularTransactions ?? [], TransactionType.Transaction);
      const smartContractResults = this.processTransactionsWithType(rawPool.txPool.smartContractResults ?? [], TransactionType.SmartContractResult);
      const rewards = this.processTransactionsWithType(rawPool.txPool.rewards ?? [], TransactionType.Reward);

      const allTransactions = await Promise.all([regularTransactions, smartContractResults, rewards]);

      allTransactions.forEach(transactions => transactionPool.push(...transactions));
    }

    return transactionPool;
  }

  // eslint-disable-next-line require-await
  private async processTransactionsWithType(transactions: any[], transactionType: TransactionType): Promise<TransactionInPool[]> {
    return Promise.all(transactions.map(tx => this.parseTransaction(tx.txFields, transactionType)));
  }

  private async parseTransaction(tx: TxInPoolFields, type: TransactionType): Promise<TransactionInPool> {
    const transaction: TransactionInPool = new TransactionInPool({
      txHash: tx.hash ?? '',
      sender: tx.sender ?? '',
      receiver: tx.receiver ?? '',
      receiverUsername: tx.receiverusername ?? '',
      nonce: tx.nonce ?? 0,
      value: tx.value ?? '',
      gasPrice: tx.gasprice ?? 0,
      gasLimit: tx.gaslimit ?? 0,
      senderShard: tx.sendershard ?? 0,
      receiverShard: tx.receivershard ?? 0,
      data: tx.data ?? '',
      guardian: tx.guardian ?? '',
      guardianSignature: tx.guardiansignature ?? '',
      signature: tx.signature ?? '',
      type: type ?? TransactionType.Transaction,
    });

    const metadata = await this.transactionActionService.getTransactionMetadata(this.poolTransactionToTransaction(transaction), false);
    if (metadata && metadata.functionName) {
      transaction.function = metadata.functionName;
    }

    return transaction;
  }

  private applyFilters(pool: TransactionInPool[], filters: PoolFilter | undefined): TransactionInPool[] {
    if (!filters) {
      return pool;
    }

    return pool.filter((transaction) => {
      return (
        (!filters.sender || transaction.sender === filters.sender) &&
        (!filters.receiver || transaction.receiver === filters.receiver) &&
        (!filters.type || transaction.type === filters.type) &&
        (filters.senderShard === undefined || transaction.senderShard === filters.senderShard) &&
        (filters.receiverShard === undefined || transaction.receiverShard === filters.receiverShard) &&
        (filters.functions === undefined || transaction.function === undefined || filters.functions.indexOf(transaction.function) > -1)
      );
    });
  }

  private poolTransactionToTransaction(transaction: TransactionInPool): Transaction {
    return ApiUtils.mergeObjects(new Transaction(), transaction);
  }
}
