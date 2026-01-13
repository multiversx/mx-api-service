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
import { AddressUtils, BinaryUtils, Constants, PendingExecuter } from '@multiversx/sdk-nestjs-common';
import { ApiUtils } from "@multiversx/sdk-nestjs-http";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { TransactionUtils } from './transaction.utils';
import { IndexerService } from "src/common/indexer/indexer.service";
import { TransactionOperation } from './entities/transaction.operation';
import { AssetsService } from 'src/common/assets/assets.service';
import { AccountAssets } from 'src/common/assets/entities/account.assets';
import crypto from 'crypto-js';
import { OriginLogger } from '@multiversx/sdk-nestjs-common';
import { ApiConfigService } from 'src/common/api-config/api.config.service';
import { UsernameService } from '../usernames/username.service';
import { MiniBlock } from 'src/common/indexer/entities/miniblock';
import { Block } from 'src/common/indexer/entities/block';
import { ProtocolService } from 'src/common/protocol/protocol.service';
import { PpuMetadata } from './entities/ppu.metadata';
import { BlockService } from '../blocks/block.service';
import { BlockFilter } from '../blocks/entities/block.filter';
import { SortOrder } from 'src/common/entities/sort.order';
import { PoolService } from '../pool/pool.service';
import { NetworkService } from 'src/endpoints/network/network.service';
import { TransactionWithPpu } from './entities/transaction.with.ppu';
import { GasBucket } from './entities/gas.bucket';
import { GasBucketConstants } from './constants/gas.bucket.constants';
import { TransactionAction } from "./transaction-action/entities/transaction.action";
import { TransactionActionCategory } from "./transaction-action/entities/transaction.action.category";

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
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => TransactionActionService))
    private readonly transactionActionService: TransactionActionService,
    private readonly assetsService: AssetsService,
    private readonly apiConfigService: ApiConfigService,
    private readonly usernameService: UsernameService,
    private readonly protocolService: ProtocolService,
    @Inject(forwardRef(() => BlockService))
    private readonly blockService: BlockService,
    @Inject(forwardRef(() => PoolService))
    private readonly poolService: PoolService,
    @Inject(forwardRef(() => NetworkService))
    private readonly networkService: NetworkService,
  ) { }

  async getTransactionCountForAddress(address: string): Promise<number> {
    return await this.cachingService.getOrSet(
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

    if (this.isCacheableTransactionCount(filter, address)) {
      return await this.cachingService.getOrSet(
        CacheInfo.TransactionsCount.key,
        async () => await this.indexerService.getTransactionCount(filter, address),
        CacheInfo.TransactionsCount.ttl,
        Constants.oneSecond(),
      );
    }

    return await this.indexerService.getTransactionCount(filter, address);
  }

  public reorderAccountSentTransactionsByNonce(transactions: TransactionDetailed[], accountAddress: string): TransactionDetailed[] {
    const sentPositions: number[] = [];
    const sentTransactions: TransactionDetailed[] = [];

    transactions.forEach((tx, index) => {
      if (tx.sender === accountAddress) {
        sentPositions.push(index);
        sentTransactions.push(tx);
      }
    });

    sentTransactions.sort((a, b) => {
      const nonceA = a.nonce ?? 0;
      const nonceB = b.nonce ?? 0;
      return nonceB - nonceA;
    });

    const result = [...transactions];

    sentPositions.forEach((position, index) => {
      result[position] = sentTransactions[index];
    });

    return result;
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
      address => CacheInfo.Username(address).key,
      async address => await this.usernameService.getUsernameForAddressRaw(address),
      CacheInfo.Username('').ttl
    );

    const result: Record<string, AccountAssets> = {};

    for (const address of addresses) {
      const username = resultDict[CacheInfo.Username(address).key];
      if (username) {
        const assets = this.getAssetsFromUsername(username);
        if (assets) {
          result[address] = assets;
        }
      }
    }

    return result;
  }

  async getTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string, fields?: string[]): Promise<Transaction[]> {
    if (this.isCacheableTransactionList(filter, queryOptions, fields, address)) {
      const cacheInfo = CacheInfo.Transactions(pagination);
      return await this.cachingService.getOrSet(
        cacheInfo.key,
        () => this.computeTransactions(filter, pagination, queryOptions, address, fields),
        cacheInfo.ttl,
        Constants.oneSecond(),
      );
    }

    return await this.computeTransactions(filter, pagination, queryOptions, address, fields);
  }

  private async computeTransactions(filter: TransactionFilter, pagination: QueryPagination, queryOptions?: TransactionQueryOptions, address?: string, fields?: string[]): Promise<Transaction[]> {
    const elasticTransactions = await this.indexerService.getTransactions(filter, pagination, address);

    let transactions: TransactionDetailed[] = [];
    transactions = elasticTransactions.map(x => ApiUtils.mergeObjects(new TransactionDetailed(), x));

    const hasSenderFilter = filter.sender || (filter.senders && filter.senders.length > 0);
    const hasReceiverFilter = filter.receivers && filter.receivers.length > 0;

    if (address && !hasSenderFilter && !hasReceiverFilter) {
      transactions = this.reorderAccountSentTransactionsByNonce(transactions, address);
    }

    if (filter.hashes) {
      const txHashes: string[] = filter.hashes;
      const elasticHashes = elasticTransactions.map(({ txHash }: any) => txHash);
      const missingHashes: string[] = txHashes.except(elasticHashes);

      const gatewayTransactions = await Promise.all(missingHashes.map((txHash) => this.transactionGetService.tryGetTransactionFromGatewayForList(txHash)));
      for (const gatewayTransaction of gatewayTransactions) {
        if (gatewayTransaction) {
          transactions.push(ApiUtils.mergeObjects(new TransactionDetailed(), gatewayTransaction));
        }
      }
    }

    if ((queryOptions && queryOptions.withBlockInfo) || (fields && fields.includesSome(['senderBlockHash', 'receiverBlockHash', 'senderBlockNonce', 'receiverBlockNonce']))) {
      await this.applyBlockInfo(transactions);
    }

    if (queryOptions && (queryOptions.withScResults || queryOptions.withOperations || queryOptions.withLogs)) {
      queryOptions.withScResultLogs = queryOptions.withLogs;
      transactions = await this.getExtraDetailsForTransactions(elasticTransactions, transactions, queryOptions);
    }

    for (const transaction of transactions) {
      transaction.type = undefined;
    }

    await this.processTransactions(transactions, {
      withScamInfo: queryOptions?.withScamInfo ?? false,
      withUsername: queryOptions?.withUsername ?? false,
      withActionTransferValue: queryOptions?.withActionTransferValue ?? false,
    });

    this.processRelayedInfo(transactions);

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

  async getTransaction(txHash: string, fields?: string[], withActionTransferValue: boolean = false): Promise<TransactionDetailed | null> {
    let transaction = await this.transactionGetService.tryGetTransactionFromElastic(txHash, fields);

    if (transaction === null) {
      transaction = await this.transactionGetService.tryGetTransactionFromGateway(txHash);
    }

    if (transaction !== null) {
      transaction.price = await this.getTransactionPrice(transaction);

      await this.processTransactions([transaction], { withScamInfo: true, withUsername: true, withActionTransferValue });
      this.processRelayedInfo([transaction]);

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

  async applyAssets(transactions: Transaction[], options: { withUsernameAssets: boolean }): Promise<void> {
    function getAssets(address: string) {
      return accountAssets[address] ?? usernameAssets[address];
    }

    const accountAssets = await this.assetsService.getAllAccountAssets();

    let usernameAssets: Record<string, AccountAssets> = {};
    if (options.withUsernameAssets && this.apiConfigService.getMaiarIdUrl()) {
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

  async createTransaction(transaction: TransactionCreate): Promise<TransactionSendResult | string> {
    const shardCount = await this.protocolService.getShardCount();
    const receiverShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.receiver), shardCount);
    const senderShard = AddressUtils.computeShard(AddressUtils.bech32Decode(transaction.sender), shardCount);

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

  public processRelayedInfo(transactions: TransactionDetailed[]) {
    for (const transaction of transactions) {
      transaction.relayedVersion = this.extractRelayedVersion(transaction);
      if (transaction.relayedVersion && ["v1", "v2"].includes(transaction.relayedVersion)) {
        const shouldSkip = this.apiConfigService.shouldDeprecateRelayedV1V2(transaction.epoch ?? 0);
        if (shouldSkip) {
          transaction.function = undefined;
          transaction.action = new TransactionAction({
            category: TransactionActionCategory.deprecatedRelayedV1V2,
            name: "Deprecated transaction action",
            description: `Relayed v1/v2 transactions are deprecated`,
          });
        }
      }
      if (!transaction.isRelayed) {
        transaction.relayedVersion = undefined;
      }
    }
  }

  async processTransactions(transactions: Transaction[], options: { withScamInfo: boolean, withUsername: boolean, withActionTransferValue: boolean }): Promise<void> {

    this.normalizeTimestampMs(transactions);

    try {
      await this.pluginsService.processTransactions(transactions, options.withScamInfo);
    } catch (error) {
      this.logger.error(`Unhandled error when processing plugin transaction for transactions with hashes '${transactions.map(x => x.txHash).join(',')}'`);
      this.logger.error(error);
    }

    for (const transaction of transactions) {
      try {
        transaction.action = await this.transactionActionService.getTransactionAction(transaction, options.withActionTransferValue);

        transaction.pendingResults = await this.getPendingResults(transaction);
        if (transaction.pendingResults === true) {
          transaction.status = TransactionStatus.pending;
        }
      } catch (error) {
        this.logger.error(`Unhandled error when processing transaction for transaction with hash '${transaction.txHash}'`);
        this.logger.error(error);
      }
    }

    await this.applyAssets(transactions, { withUsernameAssets: options.withUsername });
  }


  private normalizeTimestampMs(transactions: Transaction[]): void {
    for (const transaction of transactions) {
      if ((!transaction.timestampMs || transaction.timestampMs === 0) && transaction.timestamp) {
        transaction.timestampMs = transaction.timestamp * 1000;
      }
    }
  }

  private async getPendingResults(transaction: Transaction): Promise<boolean | undefined> {
    const twentyMinutes = Constants.oneMinute() * 20 * 1000;
    const timestampLimit = (new Date().getTime() - twentyMinutes) / 1000;
    if (transaction.timestamp < timestampLimit) {
      return undefined;
    }

    const pendingResult = await this.cachingService.get(CacheInfo.TransactionPendingResults(transaction.txHash).key);
    if (!pendingResult) {
      return undefined;
    }

    return true;
  }

  async getExtraDetailsForTransactions(elasticTransactions: any[], transactions: Transaction[], queryOptions: TransactionQueryOptions): Promise<TransactionDetailed[]> {
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

    await this.transactionGetService.applyNftNameOnTransactionOperations(detailedTransactions);

    return detailedTransactions;
  }

  private smartContractResultsExecutor = new PendingExecuter();

  public async getSmartContractResults(hashes: Array<string>): Promise<Array<SmartContractResult[] | undefined>> {
    return await this.smartContractResultsExecutor.execute(crypto.MD5(hashes.join(',')).toString(), async () => await this.getSmartContractResultsRaw(hashes));
  }

  private async getSmartContractResultsRaw(transactionHashes: Array<string>): Promise<Array<SmartContractResult[] | undefined>> {
    const resultsRaw = await this.indexerService.getSmartContractResults(transactionHashes) as any[];

    const resultsByHash = new Map<string, any[]>();

    for (const result of resultsRaw) {
      result.hash = result.scHash;
      delete result.scHash;

      const txHash = result.originalTxHash;
      if (!resultsByHash.has(txHash)) {
        resultsByHash.set(txHash, []);
      }
      resultsByHash.get(txHash)?.push(result);
    }

    const results: Array<SmartContractResult[] | undefined> = [];
    for (const transactionHash of transactionHashes) {
      const resultRaw = resultsByHash.get(transactionHash);

      if (resultRaw && resultRaw.length > 0) {
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

    await this.transactionGetService.applyNftNameOnTransactionOperations(transactions);

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

  async applyBlockInfo(transactions: TransactionDetailed[]): Promise<void> {
    const miniBlockHashes = transactions
      .filter(x => x.miniBlockHash)
      .map(x => x.miniBlockHash ?? '')
      .distinct();

    if (miniBlockHashes.length > 0) {
      const miniBlocks = await this.indexerService.getMiniBlocks({ from: 0, size: miniBlockHashes.length }, { hashes: miniBlockHashes });
      const indexedMiniBlocks = miniBlocks.toRecord<MiniBlock>(x => x.miniBlockHash);

      const senderBlockHashes: string[] = miniBlocks.map(x => x.senderBlockHash);
      const receiverBlockHashes: string[] = miniBlocks.map(x => x.receiverBlockHash);
      const blockHashes = [...senderBlockHashes, ...receiverBlockHashes].distinct().filter(x => x);

      const blocks = await this.indexerService.getBlocks({ hashes: blockHashes }, { from: 0, size: blockHashes.length });
      const indexedBlocks = blocks.toRecord<Block>(x => x.hash);

      for (const transaction of transactions) {
        const miniBlock = indexedMiniBlocks[transaction.miniBlockHash ?? ''];
        if (miniBlock) {
          transaction.senderBlockHash = miniBlock.senderBlockHash;
          transaction.receiverBlockHash = miniBlock.receiverBlockHash;

          const senderBlock = indexedBlocks[miniBlock.senderBlockHash];
          if (senderBlock) {
            transaction.senderBlockNonce = senderBlock.nonce;
          }

          const receiverBlock = indexedBlocks[miniBlock.receiverBlockHash];
          if (receiverBlock) {
            transaction.receiverBlockNonce = receiverBlock.nonce;
          }
        }
      }
    }
  }

  private extractRelayedVersion(transaction: TransactionDetailed): string | undefined {
    if (transaction.data) {
      const decodedData = BinaryUtils.base64Decode(transaction.data);

      if (decodedData.startsWith('relayedTx@')) {
        return 'v1';
      } else if (decodedData.startsWith('relayedTxV2@')) {
        return 'v2';
      }
    }

    if (transaction.relayer) {
      return 'v3';
    }

    return undefined;
  }

  async getPpuByShardId(shardId: number): Promise<PpuMetadata | null> {
    return await this.cachingService.getOrSet(
      CacheInfo.PpuMetadataByShard(shardId).key,
      async () => await this.getPpuByShardIdRaw(shardId),
      CacheInfo.PpuMetadataByShard(shardId).ttl,
      Constants.oneSecond(),
    );
  }

  async getPpuByShardIdRaw(shardId: number): Promise<PpuMetadata | null> {
    try {
      if (shardId < 0 || shardId > 2) {
        return null;
      }

      const blocks = await this.blockService.getBlocks(
        new BlockFilter({ shard: shardId, order: SortOrder.desc }),
        new QueryPagination({ from: 0, size: 1 })
      );

      if (!blocks || blocks.length === 0) {
        this.logger.error(`No blocks found for shard ${shardId}`);
        return null;
      }

      const lastBlock = blocks[0].nonce;
      const networkConstants = await this.networkService.getConstants();
      const { minGasLimit, gasPerDataByte, gasPriceModifier } = networkConstants;
      const gasPriceModifierNumber = Number(gasPriceModifier);
      const { GAS_BUCKET_SIZE, FAST_BUCKET_INDEX, FASTER_BUCKET_INDEX } = GasBucketConstants;

      const poolTransactions = await this.poolService.getPoolWithFilters({ senderShard: shardId });

      if (!poolTransactions || poolTransactions.length === 0) {
        return new PpuMetadata({
          lastBlock: lastBlock,
          fast: 0,
          faster: 0,
        });
      }

      const transactionsWithPpu = this.calculatePpuForTransactions(
        poolTransactions,
        minGasLimit,
        gasPerDataByte,
        gasPriceModifierNumber
      );

      const sortedTransactions = this.sortTransactionsByPriority(transactionsWithPpu);
      const gasBuckets = this.distributeTransactionsIntoGasBuckets(sortedTransactions, GAS_BUCKET_SIZE);

      const fastPpu = gasBuckets.length > FAST_BUCKET_INDEX && gasBuckets[FAST_BUCKET_INDEX].ppuEnd
        ? gasBuckets[FAST_BUCKET_INDEX].ppuEnd
        : 0;

      const fasterPpu = gasBuckets.length > FASTER_BUCKET_INDEX && gasBuckets[FASTER_BUCKET_INDEX].ppuEnd
        ? gasBuckets[FASTER_BUCKET_INDEX].ppuEnd
        : 0;

      return new PpuMetadata({
        lastBlock: lastBlock,
        fast: fastPpu,
        faster: fasterPpu,
      });
    } catch (error) {
      this.logger.error(`Error getting price per unit metadata for shard ${shardId}`, {
        path: 'transactionService.getPpuByShardIdRaw',
        shardId,
        error,
      });
      return null;
    }
  }

  private calculatePpuForTransactions(
    transactions: any[],
    minGasLimit: number,
    gasPerDataByte: number,
    gasPriceModifier: number
  ): TransactionWithPpu[] {
    return transactions.map(tx => {
      const data = tx.data ? BinaryUtils.base64Decode(tx.data) : '';
      const gasLimit = Number(tx.gasLimit);
      const gasPrice = Number(tx.gasPrice);

      const dataCost = minGasLimit + data.length * gasPerDataByte;
      const executionCost = gasLimit - dataCost;
      const initiallyPaidFee = dataCost * gasPrice + executionCost * gasPrice * gasPriceModifier;
      const ppu = Math.floor(initiallyPaidFee / gasLimit);

      return { ...tx, ppu };
    });
  }

  private sortTransactionsByPriority(transactions: TransactionWithPpu[]): TransactionWithPpu[] {
    return [...transactions].sort((a, b) => {
      // Same sender - sort by nonce
      if (a.sender === b.sender) {
        return a.nonce - b.nonce;
      }

      // Different PPU - sort by PPU (descending)
      if (a.ppu !== b.ppu) {
        return b.ppu - a.ppu;
      }

      // Different gas limit - sort by gas limit (descending)
      if (a.gasLimit !== b.gasLimit) {
        return b.gasLimit - a.gasLimit;
      }

      // Otherwise sort by hash (lexicographically)
      return a.txHash.localeCompare(b.txHash);
    });
  }

  private distributeTransactionsIntoGasBuckets(
    transactions: TransactionWithPpu[],
    gasBucketSize: number
  ): GasBucket[] {
    const buckets: GasBucket[] = [];
    let currentBucket: GasBucket = {
      index: 0,
      gasAccumulated: 0,
      ppuBegin: 0,
      numTransactions: 0,
    };

    for (const transaction of transactions) {
      const gasLimit = Number(transaction.gasLimit);
      currentBucket.gasAccumulated += gasLimit;
      currentBucket.numTransactions += 1;

      if (currentBucket.numTransactions === 1) {
        currentBucket.ppuBegin = transaction.ppu;
      }

      if (currentBucket.gasAccumulated >= gasBucketSize) {
        currentBucket.ppuEnd = transaction.ppu;
        buckets.push(currentBucket);

        currentBucket = {
          index: currentBucket.index + 1,
          gasAccumulated: 0,
          ppuBegin: 0,
          numTransactions: 0,
        };
      }
    }

    if (currentBucket.numTransactions > 0) {
      currentBucket.ppuEnd = transactions[transactions.length - 1].ppu;
      buckets.push(currentBucket);
    }
    for (const bucket of buckets) {
      this.logger.log(`Bucket ${bucket.index}, gas = ${bucket.gasAccumulated}, num_txs = ${bucket.numTransactions}, ppu: ${bucket.ppuBegin} .. ${bucket.ppuEnd}`);
    }

    return buckets;
  }

  private isEmptyTransactionFilter(filter: TransactionFilter): boolean {
    return !filter.address &&
      !filter.sender &&
      !(filter.senders && filter.senders.length > 0) &&
      !(filter.receivers && filter.receivers.length > 0) &&
      !filter.token &&
      !(filter.tokens && filter.tokens.length > 0) &&
      !(filter.functions && filter.functions.length > 0) &&
      filter.senderShard === undefined &&
      filter.receiverShard === undefined &&
      !filter.miniBlockHash &&
      !(filter.hashes && filter.hashes.length > 0) &&
      filter.status === undefined &&
      filter.before === undefined &&
      filter.after === undefined &&
      filter.condition === undefined &&
      filter.order === undefined &&
      filter.senderOrReceiver === undefined &&
      filter.isScCall === undefined &&
      filter.isRelayed === undefined &&
      filter.relayer === undefined &&
      filter.round === undefined &&
      filter.withRefunds === undefined &&
      filter.withRelayedScresults === undefined &&
      filter.withTxsRelayedByAddress === undefined;
  }

  private isCacheableTransactionList(filter: TransactionFilter, queryOptions?: TransactionQueryOptions, fields?: string[], address?: string): boolean {
    const hasFieldSelection = Array.isArray(fields) && fields.length > 0;
    if (address || hasFieldSelection || !this.isEmptyTransactionFilter(filter) || !queryOptions) {
      return false;
    }

    const hasAnyEnrichmentOption = queryOptions.withScResults ||
      queryOptions.withBlockInfo ||
      queryOptions.withActionTransferValue ||
      queryOptions.withUsername ||
      queryOptions.withTxsOrder ||
      queryOptions.withOperations !== undefined ||
      queryOptions.withLogs !== undefined;

    return !hasAnyEnrichmentOption;
  }

  private isCacheableTransactionCount(filter: TransactionFilter, address?: string): boolean {
    return !address && this.isEmptyTransactionFilter(filter);
  }
}
