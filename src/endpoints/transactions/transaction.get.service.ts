import { Injectable, Logger } from "@nestjs/common";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { ElasticService } from "src/common/elastic/elastic.service";
import { ElasticQuery } from "src/common/elastic/entities/elastic.query";
import { ElasticSortOrder } from "src/common/elastic/entities/elastic.sort.order";
import { ElasticSortProperty } from "src/common/elastic/entities/elastic.sort.property";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { QueryType } from "src/common/elastic/entities/query.type";
import { GatewayService } from "src/common/gateway/gateway.service";
import { ApiUtils } from "src/utils/api.utils";
import { BinaryUtils } from "src/utils/binary.utils";
import { SmartContractResult } from "../sc-results/entities/smart.contract.result";
import { Transaction } from "./entities/transaction";
import { TransactionDetailed } from "./entities/transaction.detailed";
import { TransactionLog } from "./entities/transaction.log";
import { TransactionOperation } from "./entities/transaction.operation";
import { TransactionOptionalFieldOption } from "./entities/transaction.optional.field.options";
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

  async getTransactionLogsFromElastic(hashes: string[]): Promise<any[]> {
    let queries = [];
    for (let hash of hashes) {
      queries.push(QueryType.Match('_id', hash));
    }

    const elasticQueryLogs = ElasticQuery.create()
      .withPagination({ from: 0, size: 100})
      .withCondition(QueryConditionOptions.should, queries);

    return await this.elasticService.getLogsForTransactionHashes(elasticQueryLogs);
  }

  async getTransactionScResultsFromElastic(txHash: string): Promise<SmartContractResult[]> {
    const originalTxHashQuery = QueryType.Match('originalTxHash', txHash);
    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.ascending };

    const elasticQuerySc = ElasticQuery.create()
      .withPagination({ from: 0, size: 100 })
      .withSort([timestamp])
      .withCondition(QueryConditionOptions.must, [originalTxHashQuery]);

    let scResults = await this.elasticService.getList('scresults', 'hash', elasticQuerySc);

    return scResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));      
  }

  async tryGetTransactionFromElastic(txHash: string, optionalFields?: string[]): Promise<TransactionDetailed | null> {
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
        if (result.hasScResults === true && optionalFields && optionalFields.includes(TransactionOptionalFieldOption.results)) {
          transactionDetailed.results = await this.getTransactionScResultsFromElastic(transactionDetailed.txHash);

          for (let scResult of transactionDetailed.results) {
            hashes.push(scResult.hash);
          }
        }
        
        if (optionalFields && optionalFields.includes(TransactionOptionalFieldOption.receipt)) {
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
        }

        if (optionalFields && optionalFields.includes(TransactionOptionalFieldOption.logs)) {
        //Elastic query for logs
          const logs = await this.getTransactionLogsFromElastic(hashes);
          let transactionLogs: TransactionLog[] = logs.map(log => ApiUtils.mergeObjects(new TransactionLog(), log._source));

          transactionDetailed.operations = this.tokenTransferService.getOperationsForTransactionLogs(txHash, transactionLogs);
          transactionDetailed.operations = this.trimOperations(transactionDetailed.operations);

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
      }

      return ApiUtils.mergeObjects(new TransactionDetailed(), transactionDetailed);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  private trimOperations(operations: TransactionOperation[]): TransactionOperation[] {
    let result: TransactionOperation[] = [];

    for (let operation of operations) {
      let identicalOperations = result.filter(x => 
        x.sender === operation.sender && 
        x.receiver === operation.receiver && 
        x.collection === operation.collection &&
        x.identifier === operation.identifier &&
        x.type === operation.type &&
        x.action === 'transfer'
      );

      if (identicalOperations.length > 0) {
        if (BigInt(identicalOperations[0].value) > BigInt(operation.value)) {
          result.remove(identicalOperations[0]);
        } else {
          continue;
        }
      }

      result.push(operation);
    }

    return result;
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
      let transactionResult = await this.gatewayService.get(`transaction/${txHash}?withResults=true`, async (error) => {
        if (error.response.data.error === 'transaction not found') {
          return true;
        }

        return false;
      });

      if (!transactionResult) {
        return null;
      }

      let transaction = transactionResult.transaction;
      if (!transaction) {
        return null;
      }

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