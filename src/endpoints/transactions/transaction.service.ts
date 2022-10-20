import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Transaction } from './entities/transaction';
import { TransactionCreate } from './entities/transaction.create';
import { TransactionDetailed } from './entities/transaction.detailed';
import { TransactionFilter } from './entities/transaction.filter';
import { TransactionSendResult } from './entities/transaction.send.result';
import { TransactionGetService } from './transaction.get.service';
import { TokenTransferService } from '../tokens/token.transfer.service';
import { TransactionPriceService } from './transaction.price.service';
import { TransactionQueryOptions } from './entities/transactions.query.options';
import { SmartContractResult } from '../sc-results/entities/smart.contract.result';
import { GatewayService } from 'src/common/gateway/gateway.service';
import { TransactionLog } from './entities/transaction.log';
import { QueryPagination } from 'src/common/entities/query.pagination';
import { PluginService } from 'src/common/plugins/plugin.service';
import { CacheInfo } from 'src/utils/cache.info';
import { GatewayComponentRequest } from 'src/common/gateway/entities/gateway.component.request';
import { TransactionActionService } from './transaction-action/transaction.action.service';
import { TransactionDecodeDto } from './entities/dtos/transaction.decode.dto';
import { TransactionStatus } from './entities/transaction.status';
import { AddressUtils, ApiUtils, Constants, CachingService, PendingExecuter, ApiService } from '@elrondnetwork/erdnest';
import { TransactionUtils } from './transaction.utils';
import { IndexerService } from "src/common/indexer/indexer.service";
import { TransactionOperation } from './entities/transaction.operation';
import { AssetsService } from 'src/common/assets/assets.service';
import { AccountAssets } from 'src/common/assets/entities/account.assets';
import crypto from 'crypto-js';
import { OriginLogger } from '@elrondnetwork/erdnest';
import { ApiConfigService } from 'src/common/api-config/api.config.service';

@Injectable()
export class TransactionService {
  private readonly logger = new OriginLogger(TransactionService.name);

  constructor(
    private readonly indexerService: IndexerService,
    private readonly gatewayService: GatewayService,
    private readonly transactionPriceService: TransactionPriceService,
    @Inject(forwardRef(() => TransactionGetService))
    private readonly transactionGetService: TransactionGetService,
    @Inject(forwardRef(() => TokenTransferService))
    private readonly tokenTransferService: TokenTransferService,
    private readonly pluginsService: PluginService,
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => TransactionActionService))
    private readonly transactionActionService: TransactionActionService,
    private readonly assetsService: AssetsService,
    private readonly apiConfigService: ApiConfigService,
    private readonly apiService: ApiService,
  ) { }

  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.cachingService.getOrSetCache(
      CacheInfo.TxCount(address).key,
      async () => await this.getTransactionCountForAddressRaw(address),
      CacheInfo.TxCount(address).ttl,
      Constants.oneSecond(),
    );
  }

  async getTransactionCountForAddressRaw(address: string): Promise<number> {
    return await this.indexerService.getTransactionCountForAddress(address);
  }

  async getTransactionCount(filter: TransactionFilter, address?: string): Promise<number> {
    if (TransactionUtils.isTransactionCountQueryWithAddressOnly(filter, address)) {
      return this.getTransactionCountForAddress(address ?? '');
    }

    if (TransactionUtils.isTransactionCountQueryWithSenderAndReceiver(filter)) {
      return this.getTransactionCountForAddress(filter.sender ?? '');
    }

    return await this.indexerService.getTransactionCount(filter, address);
  }

  private getDistinctUserAddressesFromTransactions(transactions: Transaction[]): string[] {
    const allAddresses = [];
    for (const transaction of transactions) {
      allAddresses.push(transaction.sender);
      allAddresses.push(transaction.receiver);

      const actionReceiver = transaction.action?.arguments?.receiver;
      if (actionReceiver) {
        allAddresses.push(actionReceiver);
      }

      if (transaction instanceof TransactionDetailed) {
        if (transaction.results) {
          for (const result of transaction.results) {
            allAddresses.push(result.sender);
            allAddresses.push(result.receiver);
          }
        }

        if (transaction.operations) {
          for (const operation of transaction.operations) {
            if (operation.sender) {
              allAddresses.push(operation.sender);
            }

            if (operation.receiver) {
              allAddresses.push(operation.receiver);
            }
          }
        }

        if (transaction.logs) {
          allAddresses.push(transaction.logs.address);

          for (const event of transaction.logs.events) {
            allAddresses.push(event.address);
          }
        }
      }
    }

    return allAddresses.distinct().filter(x => !AddressUtils.isSmartContractAddress(x));
  }

  private async getUsernameAssetsForAddresses(addresses: string[]): Promise<Record<string, AccountAssets>> {
    const resultDict = await this.cachingService.batchGetAll(
      addresses,
      address => `username:${address}`,
      async address => await this.getUsername(address),
      Constants.oneHour(),
      100
    );

    const result: Record<string, AccountAssets> = {};

    for (const address of addresses) {
      const username = resultDict[`username:${address}`];
      if (username) {
        const assets = this.getAssetsFromUsername(username);
        if (assets) {
          result[address] = assets;
        }
      }
    }

    return result;
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string): Promise<Transaction[]> {
    const elasticTransactions = await this.indexerService.getTransactions(filter, pagination, address);

    let transactions = elasticTransactions.map(x => ApiUtils.mergeObjects(new Transaction(), x));

    if (filter.hashes) {
      const txHashes: string[] = filter.hashes;
      const elasticHashes = elasticTransactions.map(({ txHash }: any) => txHash);
      const missingHashes: string[] = txHashes.except(elasticHashes);

      const gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.transactionGetService.tryGetTransactionFromGatewayForList(txHash)));
      for (const gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(gatewayTransaction);
        }
      }
    }

    if (queryOptions && (queryOptions.withScResults || queryOptions.withOperations || queryOptions.withLogs) && elasticTransactions.some(x => x.hasScResults === true)) {
      queryOptions.withScResultLogs = queryOptions.withLogs;

      transactions = await this.getExtraDetailsForTransactions(elasticTransactions, transactions, queryOptions);
    }

    await this.processTransactions(transactions, queryOptions?.withScamInfo ?? false, queryOptions?.withUsername ?? false);

    return transactions;
  }

  private getAssetsFromUsername(username: string | null | undefined): AccountAssets | undefined {
    if (!username) {
      return undefined;
    }

    return new AccountAssets({
      name: username,
      tags: ['dns', 'username'],
    });
  }

  async getTransaction(txHash: string, fields?: string[]): Promise<TransactionDetailed | null> {
    let transaction = await this.transactionGetService.tryGetTransactionFromElastic(txHash, fields);

    if (transaction === null) {
      transaction = await this.transactionGetService.tryGetTransactionFromGateway(txHash);
    }

    if (transaction !== null) {
      transaction.price = await this.getTransactionPrice(transaction);

      await this.processTransactions([transaction], true, true);

      if (transaction.pendingResults === true && transaction.results) {
        for (const result of transaction.results) {
          if (!result.logs || !result.logs.events) {
            continue;
          }

          for (const event of result.logs.events) {
            if (event.identifier === 'completedTxEvent') {
              transaction.pendingResults = undefined;
            }
          }
        }
      }
    }

    return transaction;
  }

  async applyAssets(transactions: Transaction[], withUsernameAssets: boolean): Promise<void> {
    function getAssets(address: string) {
      return accountAssets[address] ?? usernameAssets[address];
    }

    const accountAssets = await this.assetsService.getAllAccountAssets();

    let usernameAssets: Record<string, AccountAssets> = {};
    if (withUsernameAssets && this.apiConfigService.getMaiarIdUrl()) {
      const addresses = this.getDistinctUserAddressesFromTransactions(transactions);

      usernameAssets = await this.getUsernameAssetsForAddresses(addresses);
    }

    for (const transaction of transactions) {

      transaction.senderAssets = getAssets(transaction.sender);
      transaction.receiverAssets = getAssets(transaction.receiver);

      if (transaction.action?.arguments?.receiver) {
        transaction.action.arguments.receiverAssets = getAssets(transaction.action.arguments.receiver);
      }

      if (transaction instanceof TransactionDetailed) {
        if (transaction.results) {
          for (const result of transaction.results) {
            result.senderAssets = getAssets(result.sender);
            result.receiverAssets = getAssets(result.receiver);
          }
        }

        if (transaction.operations) {
          for (const operation of transaction.operations) {
            if (operation.sender) {
              operation.senderAssets = getAssets(operation.sender);
            }

            if (operation.receiver) {
              operation.receiverAssets = getAssets(operation.receiver);
            }
          }
        }

        if (transaction.logs) {
          transaction.logs.addressAssets = getAssets(transaction.logs.address);

          for (const event of transaction.logs.events) {
            event.addressAssets = getAssets(event.address);
          }
        }
      }
    }
  }

  // @ts-ignore
  private async getUsernameAssets(address: string): Promise<AccountAssets | undefined> {
    const username = await this.getUsername(address);
    if (!username) {
      return undefined;
    }

    return new AccountAssets({
      name: username,
      tags: [
        'dns',
        'username',
      ],
    });
  }

  private async getUsername(address: string): Promise<string | null> {
    try {
      const { data: { herotag: username } } = await this.apiService.get(`${this.apiConfigService.getMaiarIdUrl()}/users/api/v1/users/${address}`);

      return username;
    } catch (error) {
      this.logger.error(error);
      this.logger.error(`Error when getting username for address '${address}'`);
      return null;
    }
  }

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult | string> {
    const receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver));
    const senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender));

    const pluginTransaction = await this.pluginsService.processTransactionSend(transaction);
    if (pluginTransaction) {
      return pluginTransaction;
    }

    let txHash: string;
    try {
      const result = await this.gatewayService.create('transaction/send', GatewayComponentRequest.sendTransaction, transaction);

      txHash = result?.txHash;
    } catch (error: any) {
      return error.response?.error ?? error.response?.data?.error ?? '';
    }

    return {
      txHash,
      receiver: transaction.receiver,
      sender: transaction.sender,
      receiverShard,
      senderShard,
      status: 'Pending',
    };
  }

  async decodeTransaction(transactionDecode: TransactionDecodeDto): Promise<TransactionDecodeDto> {
    const transaction = ApiUtils.mergeObjects(new Transaction(), { ...transactionDecode });
    transactionDecode.action = await this.transactionActionService.getTransactionAction(transaction);

    return transactionDecode;
  }

  private async getTransactionPrice(transaction: TransactionDetailed): Promise<number | undefined> {
    try {
      return await this.transactionPriceService.getTransactionPrice(transaction);
    } catch (error) {
      this.logger.error(`Error when fetching transaction price for transaction with hash '${transaction.txHash}'`);
      this.logger.error(error);
      return;
    }
  }

  async processTransactions(transactions: Transaction[], withScamInfo: boolean, withUsername: boolean): Promise<void> {
    try {
      await this.pluginsService.processTransactions(transactions, withScamInfo);
    } catch (error) {
      this.logger.error(`Unhandled error when processing plugin transaction for transactions with hashes '${transactions.map(x => x.txHash).join(',')}'`);
      this.logger.error(error);
    }

    for (const transaction of transactions) {
      try {
        transaction.action = await this.transactionActionService.getTransactionAction(transaction);

        transaction.pendingResults = await this.getPendingResults(transaction);
        if (transaction.pendingResults === true) {
          transaction.status = TransactionStatus.pending;
        }
      } catch (error) {
        this.logger.error(`Unhandled error when processing transaction for transaction with hash '${transaction.txHash}'`);
        this.logger.error(error);
      }
    }

    await this.applyAssets(transactions, withUsername);
  }

  private async getPendingResults(transaction: Transaction): Promise<boolean | undefined> {
    const twentyMinutes = Constants.oneMinute() * 20 * 1000;
    const timestampLimit = (new Date().getTime() - twentyMinutes) / 1000;
    if (transaction.timestamp < timestampLimit) {
      return undefined;
    }

    const pendingResult = await this.cachingService.getCache(CacheInfo.TransactionPendingResults(transaction.txHash).key);
    if (!pendingResult) {
      return undefined;
    }

    return true;
  }

  private async getExtraDetailsForTransactions(elasticTransactions: any[], transactions: Transaction[], queryOptions: TransactionQueryOptions): Promise<TransactionDetailed[]> {
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

      if (queryOptions.withOperations) {
        const transactionHashes: string[] = [transactionDetailed.txHash];
        const previousHashes: Record<string, string> = {};
        for (const scResult of transactionScResults) {
          transactionHashes.push(scResult.hash);
          previousHashes[scResult.hash] = scResult.prevTxHash;
        }

        const transactionLogs: TransactionLog[] = logs.filter((log) => transactionHashes.includes(log.id ?? ''));
        transactionDetailed.operations = await this.tokenTransferService.getOperationsForTransaction(transactionDetailed, transactionLogs);
        transactionDetailed.operations = TransactionUtils.trimOperations(transactionDetailed.sender, transactionDetailed.operations, previousHashes);
      }

      if (queryOptions.withLogs) {
        for (const log of logs) {
          if (log.id === transactionDetailed.txHash) {
            transactionDetailed.logs = log;
          }
        }
      }

      if (queryOptions.withScResultLogs) {
        for (const log of logs) {
          if (log.id !== transactionDetailed.txHash && transactionDetailed.results) {
            const foundScResult = transactionDetailed.results.find(({ hash }) => log.id === hash);
            if (foundScResult) {
              foundScResult.logs = log;
            }
          }
        }
      }

      detailedTransactions.push(transactionDetailed);
    }

    return detailedTransactions;
  }

  private smartContractResultsExecutor = new PendingExecuter();

  public async getSmartContractResults(hashes: Array<string>): Promise<Array<SmartContractResult[] | undefined>> {
    return await this.smartContractResultsExecutor.execute(crypto.MD5(hashes.join(',')).toString(), async () => await this.getSmartContractResultsRaw(hashes));
  }

  private async getSmartContractResultsRaw(transactionHashes: Array<string>): Promise<Array<SmartContractResult[] | undefined>> {
    const resultsRaw = await this.indexerService.getSmartContractResults(transactionHashes) as any[];
    for (const result of resultsRaw) {
      result.hash = result.scHash;

      delete result.scHash;
    }

    const results: Array<SmartContractResult[] | undefined> = [];

    for (const transactionHash of transactionHashes) {
      const resultRaw = resultsRaw.filter(({ originalTxHash }) => originalTxHash == transactionHash);

      if (resultRaw.length > 0) {
        results.push(resultRaw.map((result: any) => ApiUtils.mergeObjects(new SmartContractResult(), result)));
      } else {
        results.push(undefined);
      }
    }

    return results;
  }

  public async getOperations(transactions: Array<TransactionDetailed>): Promise<Array<TransactionOperation[] | undefined>> {
    const smartContractResults = await this.getSmartContractResults(transactions.map((transaction: TransactionDetailed) => transaction.txHash));

    const logs = await this.transactionGetService.getTransactionLogsFromElastic([
      ...transactions.map((transaction: TransactionDetailed) => transaction.txHash),
      ...smartContractResults.filter((item) => item != null).flat().map((result) => result?.hash ?? ''),
    ]);

    const operations: Array<TransactionOperation[] | undefined> = [];

    for (const transaction of transactions) {
      transaction.results = smartContractResults.at(transactions.indexOf(transaction)) ?? undefined;

      const transactionHashes: Array<string> = [transaction.txHash];
      const previousTransactionHashes: Record<string, string> = {};

      for (const result of transaction.results ?? []) {
        transactionHashes.push(result.hash);
        previousTransactionHashes[result.hash] = result.prevTxHash;
      }

      const transactionLogs: Array<TransactionLog> = logs.filter((log) => transactionHashes.includes(log.id ?? ''));

      let operationsRaw: Array<TransactionOperation> = await this.tokenTransferService.getOperationsForTransaction(transaction, transactionLogs);
      operationsRaw = TransactionUtils.trimOperations(transaction.sender, operationsRaw, previousTransactionHashes);

      if (operationsRaw.length > 0) {
        operations.push(operationsRaw.map((operation: any) => ApiUtils.mergeObjects(new TransactionOperation(), operation)));
      } else {
        operations.push(undefined);
      }
    }

    return operations;
  }

  public async getLogs(hashes: Array<string>): Promise<Array<TransactionLog | undefined>> {
    const logsRaw = await this.transactionGetService.getTransactionLogsFromElastic(hashes);
    const logs: Array<TransactionLog | undefined> = [];

    for (const hash of hashes) {
      const log: TransactionLog = logsRaw.filter((log: TransactionLog) => hash === log.id)[0];

      if (log !== undefined) {
        logs.push(log);
      } else {
        logs.push(undefined);
      }
    }

    return logs;
  }
}
