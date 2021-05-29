import { Injectable } from '@nestjs/common';
import { ElasticPagination } from 'src/helpers/entities/elastic.pagination';
import { GatewayService } from 'src/helpers/gateway.service';
import { mergeObjects } from 'src/helpers/helpers';
import { ElasticService } from '../../helpers/elastic.service';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionQuery } from './entities/transaction.query';

@Injectable()
export class TransactionService {
  constructor(private readonly elasticService: ElasticService, private readonly gatewayService: GatewayService) {}

  async getTransactionCount(): Promise<number> {
    return await this.elasticService.getCount('transactions');
  }

  async getTransactions(transactionQuery: TransactionQuery): Promise<Transaction[]> {
    const query = {
      sender: transactionQuery.sender,
      receiver: transactionQuery.receiver,
      senderShard: transactionQuery.senderShard,
      receiverShard: transactionQuery.receiverShard,
      before: transactionQuery.before,
      after: transactionQuery.after
    };

    const pagination: ElasticPagination = {
      from: transactionQuery.from, 
      size: transactionQuery.size
    }

    const sort = {
      'timestamp': 'desc',
      'nonce': 'desc',
    };

    let transactions = await this.elasticService.getList('transactions', 'txHash', query, pagination, sort, transactionQuery.condition ?? 'must')

    return transactions.map(transaction => mergeObjects(new Transaction(), transaction));
  }

  async getTransaction(txHash: string): Promise<TransactionDetailed | null> {
    return this.tryGetTransactionFromElastic(txHash) ?? this.tryGetTransactionFromGateway(txHash);
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
      const {
        data: {
          transaction
        }
      } = await this.gatewayService.get(`transaction/${txHash}`);

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

  async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
    let result = await this.gatewayService.create('transaction/send', transaction);
    
    return {
      txHash: result.txHash,
      receiver: result.receiver,
      sender: result.sender,
      receiverShard: result.receiverShard,
      senderShard: result.senderShard,
      gasLimit: 0,
      gasPrice: 0,
      gasUsed: 0,
      miniBlockHash: '',
      nonce: 0,
      round: 0,
      signature: '',
      status: 'Pending',
      value: '',
      fee: '',
      timestamp: 0
    }
  }
}
