import { Injectable, Logger } from '@nestjs/common';
import { ApiConfigService } from 'src/common/api.config.service';
import { CachingService } from 'src/common/caching.service';
import { DataApiService } from 'src/common/data.api.service';
import { DataQuoteType } from 'src/common/entities/data.quote.type';
import { AbstractQuery } from 'src/common/entities/elastic/abstract.query';
import { ElasticPagination } from 'src/common/entities/elastic/elastic.pagination';
import { ElasticQuery } from 'src/common/entities/elastic/elastic.query';
import { ElasticSortOrder } from 'src/common/entities/elastic/elastic.sort.order';
import { ElasticSortProperty } from 'src/common/entities/elastic/elastic.sort.property';
import { QueryConditionOptions } from 'src/common/entities/elastic/query.condition.options';
import { QueryType } from 'src/common/entities/elastic/query.type';
import { GatewayService } from 'src/common/gateway.service';
import { AddressUtils } from 'src/utils/address.utils';
import { ApiUtils } from 'src/utils/api.utils';
import { BinaryUtils } from 'src/utils/binary.utils';
import { Constants } from 'src/utils/constants';
import { ElasticService } from '../../common/elastic.service';
import { SmartContractResult } from './entities/smart.contract.result';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionLog } from './entities/transaction.log';
import { TransactionLogEvent } from './entities/transaction.log.event';
import { TransactionLogEventIdentifier } from './entities/transaction.log.event.identifier';
import { TransactionOperation } from './entities/transaction.operation';
import { TransactionReceipt } from './entities/transaction.receipt';
import { TransactionSendResult } from './entities/transaction.send.result';
import { TransactionOperationType } from './entities/transaction.operation.type';
import { TransactionOperationAction } from './entities/transaction.operation.action';
import { QueryOperator } from 'src/common/entities/elastic/query.operator';
import { TransactionScamCheckService } from './scam-check/transaction-scam-check.service';
import { TransactionScamInfo } from './entities/transaction-scam-info';

@Injectable()
export class TransactionService {
  private readonly logger: Logger

  constructor(
    private readonly elasticService: ElasticService,
    private readonly cachingService: CachingService,
    private readonly gatewayService: GatewayService,
    private readonly apiConfigService: ApiConfigService,
    private readonly dataApiService: DataApiService,
    private readonly transactionScamCheckService: TransactionScamCheckService,
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private buildTransactionFilterQuery(filter: TransactionFilter): AbstractQuery[] {

    const queries: AbstractQuery[] = [];
    if (filter.sender) {
      queries.push(QueryType.Match('sender', filter.sender));
    }

    if (filter.receiver) {
      queries.push(QueryType.Match('receiver', filter.receiver));
    }

    if (filter.token) {
      queries.push(QueryType.Match('tokens', filter.token, QueryOperator.AND));
    }

    if (filter.senderShard !== undefined) {
      queries.push(QueryType.Match('senderShard', filter.senderShard));
    }

    if (filter.receiverShard !== undefined) {
      queries.push(QueryType.Match('receiverShard', filter.receiverShard));
    }

    if (filter.miniBlockHash) {
      queries.push(QueryType.Match('miniBlockHash', filter.miniBlockHash));
    }

    if (filter.hashes) {
      const hashArray = filter.hashes.split(',');
      queries.push(QueryType.Should(hashArray.map(hash => QueryType.Match('_id', hash))));
    }

    if (filter.status) {
      queries.push(QueryType.Match('status', filter.status));
    }

    if (filter.search) {
      queries.push(QueryType.Wildcard('data', `*${filter.search}*`));
    }

    return queries;
  }

  async getTransactionCount(filter: TransactionFilter): Promise<number> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();
    elasticQueryAdapter.condition[filter.condition ?? QueryConditionOptions.must] = this.buildTransactionFilterQuery(filter);

    if (filter.before || filter.after) {
      elasticQueryAdapter.filter = [
        QueryType.Range('timestamp', filter.before ?? 0, filter.after ?? 0),
      ]
    }

    return await this.elasticService.getCount('transactions', elasticQueryAdapter);
  }

  async getTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    const elasticQueryAdapter: ElasticQuery = new ElasticQuery();

    const { from, size } = filter;
    const pagination: ElasticPagination = {
      from, size
    };
    elasticQueryAdapter.pagination = pagination;
    elasticQueryAdapter.condition[filter.condition ?? QueryConditionOptions.must] = this.buildTransactionFilterQuery(filter);

    const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.descending };
    const nonce: ElasticSortProperty = { name: 'nonce', order: ElasticSortOrder.descending };
    elasticQueryAdapter.sort = [timestamp, nonce];

    if (filter.before || filter.after) {
      elasticQueryAdapter.filter = [
        QueryType.Range('timestamp', filter.before ?? 0, filter.after ?? 0),
      ]
    }

    let elasticTransactions = await this.elasticService.getList('transactions', 'txHash', elasticQueryAdapter);

    let transactions: Transaction[] = [];

    if (filter.hashes) {
      const txHashes: string[] = filter.hashes.split(',');
      const elasticHashes = elasticTransactions.map(({txHash}) => txHash);
      const missingHashes: string[] = txHashes.findMissingElements(elasticHashes);
      
      let gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.tryGetTransactionFromGatewayForList(txHash)));
      for (let gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(gatewayTransaction);
        }
      }
    }

    for (let elasticTransaction of elasticTransactions) {
      let transaction = ApiUtils.mergeObjects(new Transaction(), elasticTransaction);

      let tokenTransfer = this.getTokenTransfer(elasticTransaction);
      if (tokenTransfer) {
        transaction.tokenValue = tokenTransfer.tokenAmount;
        transaction.tokenIdentifier = tokenTransfer.tokenIdentifier;
      }

      transactions.push(transaction);
    }

    return transactions;
  }

  private getTokenTransfer(elasticTransaction: any): { tokenIdentifier: string, tokenAmount: string } | undefined {
    if (!elasticTransaction.data) {
      return undefined;
    }

    let tokens = elasticTransaction.tokens;
    if (!tokens || tokens.length === 0) {
      return undefined;
    }

    let esdtValues = elasticTransaction.esdtValues;
    if (!esdtValues || esdtValues.length === 0) {
      return undefined;
    }

    let decodedData = BinaryUtils.base64Decode(elasticTransaction.data);
    if (!decodedData.startsWith('ESDTTransfer@')) {
      return undefined;
    }

    let token = tokens[0];
    let esdtValue = esdtValues[0];

    return { tokenIdentifier: token, tokenAmount: esdtValue };
  }

  async getTransaction(txHash: string): Promise<TransactionDetailed | null> {
    let transaction = await this.tryGetTransactionFromElastic(txHash);

    if (transaction === null) {
      transaction = await this.tryGetTransactionFromGateway(txHash);
    }

    if (transaction !== null) {
      try {
        const [price, scamInfo] = await Promise.all([
          this.getTransactionPrice(transaction),
          this.getScamInfo(transaction),
        ]);

        transaction.price = price;
        transaction.scamInfo = scamInfo;
      } catch(error) {
        this.logger.error(`Error when fetching transaction price for transaction with hash '${txHash}'`);
        this.logger.error(error);
      }
    }

    return transaction;
  }

  private async getTransactionPrice(transaction: TransactionDetailed): Promise<number | undefined> {
    let dataUrl = this.apiConfigService.getDataUrl();
    if (!dataUrl) {
      return undefined;
    }

    let transactionDate = transaction.getDate();
    if (!transactionDate) {
      return undefined;
    }

    let price = await this.getTransactionPriceForDate(transactionDate);
    if (price) {
      price = Number(price).toRounded(2);
    }

    return price;
  }

  private async getTransactionPriceForDate(date: Date): Promise<number | undefined> {
    if (date.isToday()) {
      return await this.getTransactionPriceToday();
    }

    return await this.getTransactionPriceHistorical(date);
  }

  private async getTransactionPriceToday(): Promise<number | undefined> {
    return await this.cachingService.getOrSetCache(
      'currentPrice',
      async () => await this.dataApiService.getQuotesHistoricalLatest(DataQuoteType.price),
      Constants.oneHour()
    );
  }

  private async getTransactionPriceHistorical(date: Date): Promise<number | undefined> {
    return await this.cachingService.getOrSetCache(
      `price:${date.toISODateString()}`,
      async () => await this.dataApiService.getQuotesHistoricalTimestamp(DataQuoteType.price, date.getTime() / 1000),
      Constants.oneDay() * 7
    );
  }

  private async tryGetTransactionFromElasticBySenderAndNonce(sender: string, nonce: number): Promise<TransactionDetailed | undefined> {
    const query: ElasticQuery = new ElasticQuery();
    query.pagination = { from: 0, size: 1 };

    query.condition.must = [
      QueryType.Match('sender', sender),
      QueryType.Match('nonce', nonce)
    ];

    let transactions = await this.elasticService.getList('transactions', 'txHash', query);

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
      let tokenTransfer = this.getTokenTransfer(result);
      if (tokenTransfer) {
        transactionDetailed.tokenValue = tokenTransfer.tokenAmount;
        transactionDetailed.tokenIdentifier = tokenTransfer.tokenIdentifier;
      }

      const hashes: string[] = [];
      hashes.push(txHash);

      if (!this.apiConfigService.getUseLegacyElastic()) {
        const elasticQueryAdapterSc: ElasticQuery = new ElasticQuery();
        elasticQueryAdapterSc.pagination = { from: 0, size: 100 };

        const timestamp: ElasticSortProperty = { name: 'timestamp', order: ElasticSortOrder.ascending };
        elasticQueryAdapterSc.sort = [timestamp];

        const originalTxHashQuery = QueryType.Match('originalTxHash', txHash);
        elasticQueryAdapterSc.condition.must = [originalTxHashQuery];

        if (result.hasScResults === true) {
          let scResults = await this.elasticService.getList('scresults', 'scHash', elasticQueryAdapterSc);
          for (let scResult of scResults) {
            scResult.hash = scResult.scHash;
            hashes.push(scResult.hash);

            delete scResult.scHash;
          }

          transactionDetailed.results = scResults.map(scResult => ApiUtils.mergeObjects(new SmartContractResult(), scResult));
        }

        const elasticQueryAdapterReceipts: ElasticQuery = new ElasticQuery();
        elasticQueryAdapterReceipts.pagination = { from: 0, size: 1 };

        const receiptHashQuery = QueryType.Match('receiptHash', txHash);
        elasticQueryAdapterReceipts.condition.must = [receiptHashQuery];

        let receipts = await this.elasticService.getList('receipts', 'receiptHash', elasticQueryAdapterReceipts);
        if (receipts.length > 0) {
          let receipt = receipts[0];
          transactionDetailed.receipt = ApiUtils.mergeObjects(new TransactionReceipt(), receipt);
        }

        const elasticQueryAdapterLogs: ElasticQuery = new ElasticQuery();
        elasticQueryAdapterLogs.pagination = { from: 0, size: 100 };

        let queries = [];
        for (let hash of hashes) {
          queries.push(QueryType.Match('_id', hash));
        }
        elasticQueryAdapterLogs.condition.should = queries;

        let logs: any[] = await this.elasticService.getLogsForTransactionHashes(elasticQueryAdapterLogs);
        let transactionLogs = logs.map(log => ApiUtils.mergeObjects(new TransactionLog(), log._source));

        transactionDetailed.operations = this.getOperationsForTransactionLogs(txHash, transactionLogs);

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

  getOperationsForTransactionLogs(txHash: string, logs: TransactionLog[]): TransactionOperation[] {
    let operations: (TransactionOperation | undefined)[] = [];

    for (let log of logs) {
      for (let event of log.events) {
        switch (event.identifier) {
          case TransactionLogEventIdentifier.ESDTNFTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTNFTBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTNFTAddQuantity:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.addQuantity));
            break;
          case TransactionLogEventIdentifier.ESDTNFTCreate:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.create));
            break;
          case TransactionLogEventIdentifier.MultiESDTNFTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.multiTransfer));
            break;
          case TransactionLogEventIdentifier.ESDTTransfer:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTLocalMint:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localMint));
            break;
          case TransactionLogEventIdentifier.ESDTLocalBurn:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localBurn));
            break;
          case TransactionLogEventIdentifier.ESDTWipe:
            operations.push(this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.wipe));
            break;
        }
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation!);
  }

  private getTransactionNftOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): TransactionOperation | undefined {
    try {
      let identifier = BinaryUtils.base64Decode(event.topics[0]);
      let nonce = BinaryUtils.tryBase64ToHex(event.topics[1]);
      let value = BinaryUtils.tryBase64ToBigInt(event.topics[2])?.toString() ?? '0';
      let receiver = BinaryUtils.tryBase64ToAddress(event.topics[3]) ?? log.address;

      let collection: string | undefined = undefined;
      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`
      }

      let type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

      return { action, type, collection, identifier, sender: event.address, receiver, value };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
      this.logger.error(error);
      return undefined;
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

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult | string> {
    const receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver));
    const senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender));

    let txHash: string;
    try {
      let result = await this.gatewayService.create('transaction/send', transaction);
      txHash = result.txHash;
    } catch (error) {
      this.logger.error(error);
      return error.response.data.error;
    }

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

  private async getScamInfo(transaction: TransactionDetailed): Promise<TransactionScamInfo | undefined> {
    let extrasApiUrl = this.apiConfigService.getExtrasApiUrl();
    if (!extrasApiUrl) {
      return undefined;
    }

    return await this.transactionScamCheckService.getScamInfo(transaction);
  }
}
