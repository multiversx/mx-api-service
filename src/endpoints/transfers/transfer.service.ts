import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TransactionFilter } from "../transactions/entities/transaction.filter";
import { TransactionType } from "../transactions/entities/transaction.type";
import { Transaction } from "../transactions/entities/transaction";
import { TransactionService } from "../transactions/transaction.service";
import { ApiUtils } from "@elrondnetwork/erdnest";
import { IndexerService } from "src/common/indexer/indexer.service";
import { AssetsService } from "src/common/assets/assets.service";
import {TransfersQueryOptions} from "./entities/transfers.query.options";

@Injectable()
export class TransferService {
  constructor(
    private readonly indexerService: IndexerService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly assetsService: AssetsService,
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

  async getTransfers(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransfersQueryOptions): Promise<Transaction[]> {
    let elasticOperations = await this.indexerService.getTransfers(filter, pagination);
    elasticOperations = this.sortElasticTransfers(elasticOperations);

    let transactions: Transaction[] = [];

    const assets = await this.assetsService.getAllAccountAssets();
    for (const elasticOperation of elasticOperations) {
      const transaction = ApiUtils.mergeObjects(new Transaction(), elasticOperation);
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

    if(queryOptions?.withScResults && elasticOperations.some(x => x.hasScResults === true)){
      transactions = await this.transactionService.getExtraDetailsForTransactions(elasticOperations, transactions,{withScResults: true });
    }

    await this.transactionService.processTransactions(transactions, pagination.size <= 100, assets);
    return transactions;
  }

  async getTransfersCount(filter: TransactionFilter): Promise<number> {
    return await this.indexerService.getTransfersCount(filter);
  }
}
