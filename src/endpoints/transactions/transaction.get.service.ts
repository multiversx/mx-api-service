import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api.config.service";
import { ElasticService } from "src/common/elastic.service";
import { ElasticQuery } from "src/common/entities/elastic/elastic.query";
import { ElasticSortOrder } from "src/common/entities/elastic/elastic.sort.order";
import { ElasticSortProperty } from "src/common/entities/elastic/elastic.sort.property";
import { QueryConditionOptions } from "src/common/entities/elastic/query.condition.options";
import { QueryType } from "src/common/entities/elastic/query.type";
import { GatewayService } from "src/common/gateway.service";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { SmartContractResult } from "./entities/smart.contract.result";
import { Transaction } from "./entities/transaction";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { TransactionLog } from "./entities/transaction.log";
import { TransactionReceipt } from "./entities/transaction.receipt";
import { TokenTransferService } from "./token.transfer.service";

@Injectable()
export class TransactionGetService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly tokenTransferService: TokenTransferService,
  ) {
    this.logger = new Logger(TransactionGetService.name);
  }

  private async tryGetTransactionFromElasticBySenderAndNonce(sender: string, nonce: number): Promise<TransactionDetailed | undefined> {
    const queries = [
      QueryType.Match('sender', sender),
      QueryType.Match('nonce', nonce)
    ];

    const elasticQuery = ElasticQuery.create()
      .withPagination({ from: 0, size: 1 })
      .withCondition(QueryConditionOptions.must, queries);

    let transactions = await this.elasticService.getList('transactions', 'txHash', elasticQuery);

    return transactions.firstOrUndefined();
  }

  async tryGetTransactionFromElastic(txHash: string): Promise<TransactionDetailed | null> {
    try {
      const result = await this.elasticService.getItem('transactions', 'txHash', txHash);
      if (!result) {
        return null;
      }

      if (result.scResults) {
        result.results = result.scResults;
      }

      let transactionDetailed: TransactionDetailed = ApiUtils.mergeObjects(new TransactionDetailed(), result);
      let tokenTransfer = this.tokenTransferService.getTokenTransfer(result);
      if (tokenTransfer) {
        transactionDetailed.tokenValue = tokenTransfer.tokenAmount;
        transactionDetailed.tokenIdentifier = tokenTransfer.tokenIdentifier;
      }

      const hashes: string[] = [];
      hashes.push(txHash);

      if (!this.apiConfigService.getUseLegacyElastic()) {
      //Elastic query for scResults
        const originalTxHashQuery = QueryType.Match('originalTxHash', txHash);
        const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.ascending };

        const elasticQuerySc = ElasticQuery.create()
          .withPagination({ from: 0, size: 100 })
          .withSort([timestamp])
          .withCondition(QueryConditionOptions.must, [originalTxHashQuery]);

        if (result.hasScResults === true) {
          let scResults = await this.elasticService.getList('scresults', 'scHash', elasticQuerySc);
          for (let scResult of scResults) {
            scResult.hash = scResult.scHash;
            hashes.push(scResult.hash);

            delete scResult.scHash;
          }

          transactionDetailed.results = scResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
        }
      
      //Elastic query for receipts
        const receiptHashQuery = QueryType.Match('receiptHash', txHash);
        const elasticQueryReceipts = ElasticQuery.create()
          .withPagination({ from: 0, size: 1})
          .withCondition(QueryConditionOptions.must, [receiptHashQuery])

        let receipts = await this.elasticService.getList('receipts', 'receiptHash', elasticQueryReceipts);
        if (receipts.length > 0) {
          let receipt = receipts[0];
          transactionDetailed.receipt = ApiUtils.mergeObjects(new TransactionReceipt(), receipt);
        }

      //Elastic query for logs
        let queries = [];
        for (let hash of hashes) {
          queries.push(QueryType.Match('_id', hash));
        }
        const elasticQueryLogs = ElasticQuery.create()
          .withPagination({ from: 0, size: 100})
          .withCondition(QueryConditionOptions.should, queries);

        let logs: any[] = await this.elasticService.getLogsForTransactionHashes(elasticQueryLogs);
        let transactionLogs = logs.map(log => ApiUtils.mergeObjects(new TransactionLog(), log._source));

        transactionDetailed.operations = this.tokenTransferService.getOperationsForTransactionLogs(txHash, transactionLogs);

        for (let log of logs) {
          if (log._id === txHash) {
            transactionDetailed.logs = ApiUtils.mergeObjects(new TransactionLog(), log._source);
          }
          else {
            const foundScResult = transactionDetailed.results.find(({ hash }) => log._id === hash);
            if (foundScResult) {
              foundScResult.logs = ApiUtils.mergeObjects(new TransactionLog(), log._source);
            }
          }
        }
      }

      return ApiUtils.mergeObjects(new TransactionDetailed(), transactionDetailed);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async tryGetTransactionFromGatewayForList(txHash: string) {
    const gatewayTransaction = await this.tryGetTransactionFromGateway(txHash, false);
    if (gatewayTransaction) {
      return ApiUtils.mergeObjects(new Transaction(), gatewayTransaction);  
    }
    return undefined; //invalid hash 
  }

  async tryGetTransactionFromGateway(txHash: string, queryInElastic: boolean = true): Promise<TransactionDetailed | null> {
    try {
      const { transaction } = await this.gatewayService.get(`transaction/${txHash}?withResults=true`);

      if (transaction.status === 'pending' && queryInElastic) {
        let existingTransaction = await this.tryGetTransactionFromElasticBySenderAndNonce(transaction.sender, transaction.nonce);
        if (existingTransaction && existingTransaction.txHash !== txHash) {
          return null;
        }
      }

      if (transaction.receipt) {
        transaction.receipt.value = transaction.receipt.value.toString();
      }

      if (transaction.smartContractResults) {
        for (let smartContractResult of transaction.smartContractResults) {
          smartContractResult.callType = smartContractResult.callType.toString();
          smartContractResult.value = smartContractResult.value.toString();

          if (smartContractResult.data) {
            smartContractResult.data = BinaryUtils.base64Encode(smartContractResult.data);
          }
        }
      }

      let result = {
        txHash: txHash,
        data: transaction.data,
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        gasUsed: transaction.gasUsed,
        miniBlockHash: transaction.miniblockHash,
        senderShard: transaction.sourceShard,
        receiverShard: transaction.destinationShard,
        nonce: transaction.nonce,
        receiver: transaction.receiver,
        sender: transaction.sender,
        signature: transaction.signature,
        status: transaction.status,
        value: transaction.value,
        round: transaction.round,
        fee: transaction.fee,
        timestamp: transaction.timestamp,
        scResults: transaction.smartContractResults ? transaction.smartContractResults.map((scResult: any) => ApiUtils.mergeObjects(new SmartContractResult(), scResult)) : [],
        receipt: transaction.receipt ? ApiUtils.mergeObjects(new TransactionReceipt(), transaction.receipt) : undefined,
        logs: transaction.logs
      };

      return ApiUtils.mergeObjects(new TransactionDetailed(), result);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }
}