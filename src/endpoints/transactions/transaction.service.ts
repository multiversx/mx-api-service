import { Injectable } from '@nestjs/common';
import { ElasticPagination } from 'src/helpers/entities/elastic.pagination';
import { QueryCondition } from 'src/helpers/entities/query.condition';
import { GatewayService } from 'src/helpers/gateway.service';
import { bech32Decode, computeShard, mergeObjects } from 'src/helpers/helpers';
import { ElasticService } from '../../helpers/elastic.service';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionQuery } from './entities/transaction.query';
import { TransactionSendResult } from './entities/transaction.send.result';

@Injectable()
export class TransactionService {
  constructor(
    private readonly elasticService: ElasticService, 
    private readonly gatewayService: GatewayService,
  ) {}

  private buildTransactionFilterQuery(transactionQuery: TransactionQuery){
    return {
      sender: transactionQuery.sender,
      receiver: transactionQuery.receiver,
      senderShard: transactionQuery.senderShard,
      receiverShard: transactionQuery.receiverShard,
      miniBlockHash: transactionQuery.miniBlockHash,
      before: transactionQuery.before,
      after: transactionQuery.after
    };
  }
  async getTransactionCount(transactionQuery: TransactionQuery): Promise<number> {

    console.log(transactionQuery);

    const query = this.buildTransactionFilterQuery(transactionQuery);

    console.log(transactionQuery);

    return await this.elasticService.getCount('transactions', query, transactionQuery.condition ?? QueryCondition.must);
  }

  async getTransactions(transactionQuery: TransactionQuery): Promise<Transaction[]> {
    const query = this.buildTransactionFilterQuery(transactionQuery);

    const pagination: ElasticPagination = {
      from: transactionQuery.from, 
      size: transactionQuery.size
    }

    const sort = {
      'timestamp': 'desc',
      'nonce': 'desc',
    };

    let transactions = await this.elasticService.getList('transactions', 'txHash', query, pagination, sort, transactionQuery.condition ?? QueryCondition.must)

    return transactions.map(transaction => mergeObjects(new Transaction(), transaction));
  }

  async getTransaction(txHash: string): Promise<TransactionDetailed | null> {
    let transaction = await this.tryGetTransactionFromElastic(txHash);
    console.log({transactionFromElastic: transaction});
    if (transaction === null) {
      transaction = await this.tryGetTransactionFromGateway(txHash);
      console.log({transactionFromGateway: transaction});
    }

    return transaction;
  }

  async tryGetTransactionFromElastic(txHash: string): Promise<TransactionDetailed | null> {
    try {
      const result = await this.elasticService.getItem('transactions', 'txHash', txHash);
      return mergeObjects(new TransactionDetailed(), result);
    } catch {
      return null;
    }
  }

  async tryGetTransactionFromGateway(txHash: string): Promise<TransactionDetailed | null> {
    try {
      const { transaction } = await this.gatewayService.get(`transaction/${txHash}`);

      return {
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
        scResults: []
      };
    } catch {
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
