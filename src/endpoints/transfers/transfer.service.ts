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
import { OriginLogger } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class TransferService {
  private readonly logger = new OriginLogger(TransferService.name);

  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
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

    return elasticTransfers.sortedDescending(
      (item) => item.timestamp,
      (item) => item.order
    );
  }

  private async sortElasticTransfersByTxsOrder(elasticTransfers: any[], miniBlockHash: string): Promise<any[]> {
    if (!miniBlockHash) {
      return this.sortElasticTransfers(elasticTransfers);
    }

    try {
      const block = await this.indexerService.getBlockByMiniBlockHash(miniBlockHash);

      if (!block || !block.miniBlocksDetails) {
        return this.sortElasticTransfers(elasticTransfers);
      }

      const miniBlockDetails = block.miniBlocksDetails.find((mb: any) => {
        const miniBlockIndex = block.miniBlocksHashes?.indexOf(miniBlockHash);
        return miniBlockIndex !== -1 && mb.mbIndex === miniBlockIndex;
      });

      if (!miniBlockDetails || !miniBlockDetails.executionOrderTxsIndices || !miniBlockDetails.txsHashes) {
        return this.sortElasticTransfers(elasticTransfers);
      }

      const txHashToOrder: Record<string, number> = {};
      for (let i = 0; i < miniBlockDetails.txsHashes.length; i++) {
        const txHash = miniBlockDetails.txsHashes[i];
        const executionIndex = miniBlockDetails.executionOrderTxsIndices[i];
        txHashToOrder[txHash] = executionIndex;
      }

      for (const elasticTransfer of elasticTransfers) {
        const txHash = elasticTransfer.originalTxHash || elasticTransfer.txHash;
        if (txHashToOrder.hasOwnProperty(txHash)) {
          elasticTransfer.order = txHashToOrder[txHash];
        } else {
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
      }

      return elasticTransfers.sortedDescending(
        (item) => -item.order,
        (item) => item.timestamp
      );

    } catch (error) {
      this.logger.error(`Error getting block execution order: ${error}`);
      return this.sortElasticTransfers(elasticTransfers);
    }
  }

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination, queryOptions: TransactionQueryOptions, fields?: string[]): Promise<Transaction[]> {
    let elasticOperations = await this.indexerService.getTransfers(filter, pagination);

    if (queryOptions.withTxsOrder && filter.miniBlockHash) {
      elasticOperations = await this.sortElasticTransfersByTxsOrder(elasticOperations, filter.miniBlockHash);
    } else {
      elasticOperations = this.sortElasticTransfers(elasticOperations);
    }

    let transactions: TransactionDetailed[] = [];

    for (const elasticOperation of elasticOperations) {
      const transaction = ApiUtils.mergeObjects(new TransactionDetailed(), elasticOperation);
      transaction.type = elasticOperation.type === 'normal' ? TransactionType.Transaction : TransactionType.SmartContractResult;
      if (elasticOperation.relayer) {
        transaction.relayer = elasticOperation.relayer;
        transaction.isRelayed = true;
      } else {
        transaction.relayer = elasticOperation.relayerAddr;
      }

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

    if (queryOptions && (queryOptions.withOperations || queryOptions.withLogs)) {
      queryOptions.withScResultLogs = queryOptions.withLogs;
      transactions = await this.transactionService.getExtraDetailsForTransactions(elasticOperations, transactions, queryOptions);
    }

    await this.transactionService.processTransactions(transactions, {
      withScamInfo: queryOptions.withScamInfo ?? false,
      withUsername: queryOptions.withUsername ?? false,
      withActionTransferValue: queryOptions.withActionTransferValue ?? false,
    });

    return transactions;
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerService.getTransfersCount(filter);
  }
}
