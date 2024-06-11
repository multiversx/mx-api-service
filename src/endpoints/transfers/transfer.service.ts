import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionType } from "../transactions/entities/transaction.type";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionService } from "../transactions/transaction.service";
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { IndexerService } from "src/common/indexer/indexer.service";
import { TransactionQueryOptions } from "../transactions/entities/transactions.query.options";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { TransactionGetService } from "../transactions/transaction.get.service";
import { SmartContractResult } from "../sc-results/entities/smart.contract.result";

@Injectable()
export class TransferService {
  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly transactionGetService: TransactionGetService,
  ) { }

  private sortElasticTransfers(elasticTransfers: any[]): any[] {
    for (const elasticTransfer of elasticTransfers) {
      if (elasticTransfer.originalTxHash) {
        const transaction = elasticTransfers.find(x => x.txHash === elasticTransfer.originalTxHash);
        if (transaction) {
          elasticTransfer.order = (transaction.nonce * 10) + 1;
        } else {
          elasticTransfer.order = 0;
        }
      } else {
        elasticTransfer.order = elasticTransfer.nonce * 10;
      }
    }

    elasticTransfers.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }

      return b.order - a.order;
    });

    return elasticTransfers;
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination, queryOptions: TransactionQueryOptions, fields?: string[]): Promise<Transaction[]> {
    let elasticOperations = await this.indexerService.getTransfers(filter, pagination);
    elasticOperations = this.sortElasticTransfers(elasticOperations);

    let transactions: TransactionDetailed[] = [];

    for (const elasticOperation of elasticOperations) {
      const transaction = ApiUtils.mergeObjects(new TransactionDetailed(), elasticOperation);
      transaction.type = elasticOperation.type === 'normal' ? TransactionType.Transaction : TransactionType.SmartContractResult;

      if (transaction.type === TransactionType.SmartContractResult) {
        delete transaction.gasLimit;
        delete transaction.gasPrice;
        delete transaction.gasUsed;
        delete transaction.nonce;
        delete transaction.round;
      }
      transactions.push(transaction);
    }

    if (queryOptions.withBlockInfo || (fields && fields.includesSome(['senderBlockHash', 'receiverBlockHash', 'senderBlockNonce', 'receiverBlockNonce']))) {
      await this.transactionService.applyBlockInfo(transactions);
    }

    if (queryOptions && (queryOptions.withScResults || queryOptions.withLogs)) {
      queryOptions.withScResultLogs = queryOptions.withLogs;
      transactions = await this.getExtraDetailsForTransfers(elasticOperations, transactions, queryOptions);
    }

    await this.transactionService.processTransactions(transactions, {
      withScamInfo: queryOptions.withScamInfo ?? false,
      withUsername: queryOptions.withUsername ?? false,
    });

    return transactions;
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerService.getTransfersCount(filter);
  }

  private async getExtraDetailsForTransfers(elasticTransactions: any[], transactions: Transaction[], queryOptions: TransactionQueryOptions): Promise<TransactionDetailed[]> {
    const scResults = await this.indexerService.getScResultsForTransactions(elasticTransactions) as any;
    for (const scResult of scResults) {
      scResult.hash = scResult.scHash;

      delete scResult.scHash;
    }

    const hashes = [...transactions.map((transaction) => transaction.txHash), ...scResults.map((scResult: any) => scResult.hash)];
    const logs = await this.transactionGetService.getTransactionLogsFromElastic(hashes);

    const detailedTransactions: TransactionDetailed[] = [];
    for (const transaction of transactions) {
      const transactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), transaction);
      const transactionScResults = scResults.filter(({ originalTxHash }: any) => originalTxHash == transaction.txHash);

      if (queryOptions.withScResults) {
        transactionDetailed.results = transactionScResults.map((scResult: any) => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
      }

      if (queryOptions.withLogs) {
        for (const log of logs) {
          if (log.id === transactionDetailed.txHash) {
            transactionDetailed.logs = log;
          }
        }
      }

      detailedTransactions.push(transactionDetailed);
    }
    return detailedTransactions;
  }
}
