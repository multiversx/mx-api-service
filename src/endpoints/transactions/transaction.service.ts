import { Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/helpers/api.config.service';
import { ElasticPagination } from 'src/helpers/entities/elastic.pagination';
import { QueryCondition } from 'src/helpers/entities/query.condition';
import { GatewayService } from 'src/helpers/gateway.service';
import { base64Encode, bech32Decode, computeShard, mergeObjects } from 'src/helpers/helpers';
import { ElasticService } from '../../helpers/elastic.service';
import { SmartContractResult } from './entities/smart.contract.result';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionReceipt } from './entities/transaction.receipt';
import { TransactionSendResult } from './entities/transaction.send.result';

@Injectable()
export class TransactionService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private buildTransactionFilterQuery(transactionQuery: TransactionFilter){
    return {
      sender: transactionQuery.sender,
      receiver: transactionQuery.receiver,
      senderShard: transactionQuery.senderShard,
      receiverShard: transactionQuery.receiverShard,
      miniBlockHash: transactionQuery.miniBlockHash,
      status: transactionQuery.status,
      before: transactionQuery.before,
      after: transactionQuery.after
    };
  }
  async getTransactionCount(transactionQuery: TransactionFilter): Promise<number> {
    const query = this.buildTransactionFilterQuery(transactionQuery);

    return await this.elasticService.getCount('transactions', query, transactionQuery.condition ?? QueryCondition.must);
  }

  async getTransactions(transactionQuery: TransactionFilter): Promise<Transaction[]> {
    const query = this.buildTransactionFilterQuery(transactionQuery);

    const pagination: ElasticPagination = {
      from: transactionQuery.from, 
      size: transactionQuery.size
    }

    const sort = {
      'timestamp': 'desc',
      'nonce': 'desc',
    };

    let transactions = await this.elasticService.getList('transactions', 'txHash', query, pagination, sort, transactionQuery.condition ?? QueryCondition.must);

    return transactions.map(transaction => mergeObjects(new Transaction(), transaction));
  }

  async getTransaction(txHash: string): Promise<TransactionDetailed | null> {
    let transaction = await this.tryGetTransactionFromElastic(txHash);
   
    if (transaction === null) {
      transaction = await this.tryGetTransactionFromGateway(txHash);
    }

    return transaction;
  }

  async tryGetTransactionFromElastic(txHash: string): Promise<TransactionDetailed | null> {
    try {
      const result = await this.elasticService.getItem('transactions', 'txHash', txHash);

      let transactionDetailed: TransactionDetailed = mergeObjects(new TransactionDetailed(), result);

      if (!this.apiConfigService.getUseLegacyElastic()) {
        if (result.hasScResults === true) {
          let scResults = await this.elasticService.getList('scresults', 'scHash', { originalTxHash: txHash }, { from: 0, size: 100 }, { "timestamp": "asc" });
          for (let scResult of scResults) {
            scResult.hash = scResult.scHash;

            delete scResult.scHash;
          }

          transactionDetailed.scResults = scResults.map(scResult => mergeObjects(new SmartContractResult(), scResult));
        }

        let receipts = await this.elasticService.getList('receipts', 'receiptHash', { txHash }, { from: 0, size: 1 }, { "timestamp": "asc" });
        if (receipts.length > 0) {
          let receipt = receipts[0];
          transactionDetailed.receipt = mergeObjects(new TransactionReceipt(), receipt);
        }
      }

      return mergeObjects(new TransactionDetailed(), transactionDetailed);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async tryGetTransactionFromGateway(txHash: string): Promise<TransactionDetailed | null> {
    try {
      const { transaction } = await this.gatewayService.get(`transaction/${txHash}?withResults=true`);

      if (transaction.receipt) {
        transaction.receipt.value = transaction.receipt.value.toString();
      }

      if (transaction.smartContractResults) {
        for (let smartContractResult of transaction.smartContractResults) {
          smartContractResult.callType = smartContractResult.callType.toString();
          smartContractResult.value = smartContractResult.value.toString();

          if (smartContractResult.data) {
            smartContractResult.data = base64Encode(smartContractResult.data);
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
        scResults: transaction.smartContractResults ? transaction.smartContractResults.map((scResult: any) => mergeObjects(new SmartContractResult(), scResult)) : [],
        receipt: transaction.receipt ? mergeObjects(new TransactionReceipt(), transaction.receipt) : undefined
      };

      return mergeObjects(new TransactionDetailed(), result);
    } catch (error) {
      this.logger.error(error);
      return null;
    }
  }

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult> {
    const receiverShard = computeShard(bech32Decode(transaction.receiver));
    const senderShard = computeShard(bech32Decode(transaction.sender));

    const { txHash } = await this.gatewayService.create('transaction/send', transaction);

    // TODO: pending alignment
    return {
      txHash,
      receiver: transaction.receiver,
      sender: transaction.sender,
      receiverShard,
      senderShard,
      status: 'Pending',
    };
  }
}
