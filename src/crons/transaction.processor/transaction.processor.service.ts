import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Cron } from "@nestjs/schedule";
import { ApiConfigService } from "src/common/api-config/api.config.service";
import { NodeService } from "src/endpoints/nodes/node.service";
import { ShardTransaction, TransactionProcessor } from "@elrondnetwork/transaction-processor";
import { CacheInfo } from "src/utils/cache.info";
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SftChangeTransactionExtractor } from "./extractor/sft.change.transaction.extractor";
import { TransactionExtractorInterface } from "./extractor/transaction.extractor.interface";
import { TransferOwnershipExtractor } from "./extractor/transfer.ownership.extractor";
import { MetricsEvents } from "src/utils/metrics-events.constants";
import { LogMetricsEvent } from "src/common/entities/log.metrics.event";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { AddressUtils, BinaryUtils, OriginLogger } from "@multiversx/sdk-nestjs-common";
import { PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { StakeFunction } from "src/endpoints/transactions/transaction-action/recognizers/staking/entities/stake.function";
import { AccountService } from "src/endpoints/accounts/account.service";
import { AccountDetails, AccountDetailsRepository } from "src/common/indexer/db/src";
import { TokenService } from "src/endpoints/tokens/token.service";
import { QueryPagination } from "src/common/entities/query.pagination";
import { TokenFilter } from "src/endpoints/tokens/entities/token.filter";
import { NftService } from "src/endpoints/nfts/nft.service";
import { NftFilter } from "src/endpoints/nfts/entities/nft.filter";


@Injectable()
export class TransactionProcessorService {
  private readonly systemAddresses = [
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqllls0lczs7",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqrlllsrujgla",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqrlllllllllllllllllllllllllsn60f0k",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqlllllllllllllllllllllllllllsr9gav8",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqylllslmq6y6",
    "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq0llllsqkarq6",
    "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
    "erd17rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rc0pu8s7rcqqkhty3",
    "erd1lllllllllllllllllllllllllllllllllllllllllllllllllllsckry7t",
    "erd1llllllllllllllllllllllllllllllllllllllllllllllllluqq2m3f0f",
    "erd1llllllllllllllllllllllllllllllllllllllllllllllllluqsl6e366",
    "erd1lllllllllllllllllllllllllllllllllllllllllllllllllupq9x7ny0"
  ];
  private readonly logger = new OriginLogger(TransactionProcessorService.name);
  private transactionProcessor: TransactionProcessor = new TransactionProcessor();

  constructor(
    private readonly cachingService: CacheService,
    private readonly apiConfigService: ApiConfigService,
    //@ts-ignore
    @Inject('PUBSUB_SERVICE') private clientProxy: ClientProxy,
    private readonly nodeService: NodeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly accountDetailsRepository: AccountDetailsRepository,
    private readonly accountService: AccountService,
    private readonly tokenService: TokenService,
    private readonly nftService: NftService,
  ) { }

  @Cron('*/1 * * * * *')
  async handleTx() {
    await this.transactionProcessor.start({
      gatewayUrl: this.apiConfigService.getGatewayUrl(),
      maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
      onTransactionsReceived: async (shard, nonce, transactions) => {
        const profiler = new PerformanceProfiler('Processing new transactions');

        const uniqueAddresses = new Set<string>();
        this.logger.log(`New transactions: ${transactions.length} for shard ${shard} and nonce ${nonce}`);
        const filteredTransactions = transactions.filter(transaction => transaction.status === 'success');
        // Group transactions by address to determine which fields need updating
        const addressUpdates = new Map<string, Set<string>>();

        for (const transaction of filteredTransactions) {
          // Only add addresses that are not system addresses
          if (!this.systemAddresses.includes(transaction.sender)) {
            uniqueAddresses.add(transaction.sender);
          }
          if (!this.systemAddresses.includes(transaction.receiver)) {
            uniqueAddresses.add(transaction.receiver);
          }

          // Get fields to update for sender and receiver separately
          const senderFields = this.getFieldsToUpdate(transaction);
          const receiverFields = this.getFieldsToUpdate(transaction);

          // Add fields to update for sender
          if (!addressUpdates.has(transaction.sender)) {
            addressUpdates.set(transaction.sender, new Set());
          }
          senderFields.forEach(field => addressUpdates.get(transaction.sender)?.add(field));

          // Add fields to update for receiver
          if (!addressUpdates.has(transaction.receiver)) {
            addressUpdates.set(transaction.receiver, new Set());
          }
          receiverFields.forEach(field => addressUpdates.get(transaction.receiver)?.add(field));
        }

        for (const address of uniqueAddresses) {
          const documentExists = await this.accountDetailsRepository.getAccount(address)
          const fieldsToUpdate = documentExists ? (addressUpdates.get(address) ?? new Set())
            : new Set(['guardianInfo', 'txCount', 'scrCount', 'timestamp', 'assets']);

          // Only fetch account if we need to update fields
          if (fieldsToUpdate.size > 0) {
            const accountFetchOptions = {
              withGuardianInfo: fieldsToUpdate.has('guardianInfo'),
              withTxCount: fieldsToUpdate.has('txCount'),
              withScrCount: fieldsToUpdate.has('scrCount'),
              withTimestamp: fieldsToUpdate.has('timestamp'),
              withAssets: fieldsToUpdate.has('assets')
            }
            // console.log('accountFetchOptions ', accountFetchOptions);
            const accountDetails = await this.accountService.getAccount(address, accountFetchOptions) as AccountDetails;
            if (fieldsToUpdate.has('tokens') || !documentExists) {
              accountDetails.tokens = await this.tokenService.getTokensForAddress(address, new QueryPagination({ from: 0, size: 100 }), new TokenFilter());
            }

            if (fieldsToUpdate.has('nfts') || !documentExists) {
              accountDetails.nfts = await this.nftService.getNftsForAddress(address, new QueryPagination({ from: 0, size: 100 }), new NftFilter());
            }
            // console.log('accountDetailed ', accountDetailed);
            if (accountDetails) {
              await this.accountDetailsRepository.updateAccount(accountDetails);
            }
          }
        }
        profiler.stop();
      },
      getLastProcessedNonce: async (shardId) => {
        return await this.cachingService.get<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key);
      },
      setLastProcessedNonce: async (shardId, nonce) => {
        const event = new LogMetricsEvent();
        event.args = [shardId, nonce];
        this.eventEmitter.emit(
          MetricsEvents.SetLastProcessedNonce,
          event
        );

        await this.cachingService.set<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key, nonce, CacheInfo.TransactionProcessorShardNonce(shardId).ttl);
      },
    });
  }

  private getFieldsToUpdate(transaction: ShardTransaction): Set<string> {
    const fields = new Set<string>();

    // Always update timestamp as it's transaction-related
    fields.add('timestamp');

    // Balance changes
    if (transaction.value !== '0') {
      fields.add('balance');
    }

    // Transaction count changes
    fields.add('txCount');

    // Smart contract interactions - only for smart contract addresses
    if (AddressUtils.isSmartContractAddress(transaction.receiver)) {
      fields.add('scrCount');
    }

    // Guardian changes - only for non-smart contract addresses
    if (transaction.getDataFunctionName() === 'GuardAccount' || transaction.getDataFunctionName() === 'UnGuardAccount') {
      fields.add('guardianInfo');
    }

    // Asset changes - check for transfer/mint/burn in a case-insensitive way
    const functionName = transaction.getDataFunctionName()?.toLowerCase() ?? '';
    if (functionName.includes('transfer') ||
      functionName.includes('mint') ||
      functionName.includes('burn')) {
      fields.add('tokens');
      fields.add('nfts');
    }

    return fields;
  }

  // @Cron('*/1 * * * * *')
  // async handleNewTransactions() {
  //   await this.transactionProcessor.start({
  //     gatewayUrl: this.apiConfigService.getGatewayUrl(),
  //     maxLookBehind: this.apiConfigService.getTransactionProcessorMaxLookBehind(),
  //     onTransactionsReceived: async (shard, nonce, transactions) => {
  //       const profiler = new PerformanceProfiler('Processing new transactions');

  //       this.logger.log(`New transactions: ${transactions.length} for shard ${shard} and nonce ${nonce}`);

  //       const allInvalidatedKeys = [];

  //       for (const transaction of transactions) {
  //         const invalidatedTokenProperties = await this.tryInvalidateTokenProperties(transaction);
  //         const invalidatedOwnerKeys = await this.tryInvalidateOwner(transaction);
  //         const invalidatedCollectionPropertiesKeys = await this.tryInvalidateCollectionProperties(transaction);
  //         const invalidatedStakeTopUpKey = await this.tryInvalidateStakeTopup(transaction);

  //         allInvalidatedKeys.push(
  //           ...invalidatedTokenProperties,
  //           ...invalidatedOwnerKeys,
  //           ...invalidatedCollectionPropertiesKeys,
  //           ...invalidatedStakeTopUpKey,
  //         );
  //       }

  //       const uniqueInvalidatedKeys = allInvalidatedKeys.distinct();
  //       if (uniqueInvalidatedKeys.length > 0) {
  //         this.clientProxy.emit('deleteCacheKeys', uniqueInvalidatedKeys);
  //       }

  //       const distinctSendersAndReceivers = transactions.selectMany(transaction => [transaction.sender, transaction.receiver]).distinct();
  //       const txCountInvalidationKeys = distinctSendersAndReceivers.map(address => CacheInfo.TxCount(address).key);
  //       await this.cachingService.batchDelCache(txCountInvalidationKeys);

  //       profiler.stop();
  //     },
  //     getLastProcessedNonce: async (shardId) => {
  //       return await this.cachingService.get<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key);
  //     },
  //     setLastProcessedNonce: async (shardId, nonce) => {
  //       const event = new LogMetricsEvent();
  //       event.args = [shardId, nonce];
  //       this.eventEmitter.emit(
  //         MetricsEvents.SetLastProcessedNonce,
  //         event
  //       );

  //       await this.cachingService.set<number>(CacheInfo.TransactionProcessorShardNonce(shardId).key, nonce, CacheInfo.TransactionProcessorShardNonce(shardId).ttl);
  //     },
  //   });
  // }

  //@ts-ignore
  private async tryInvalidateTokenProperties(transaction: ShardTransaction): Promise<string[]> {
    if (transaction.receiver !== this.apiConfigService.getEsdtContractAddress()) {
      return [];
    }

    const transactionFuncName = transaction.getDataFunctionName();

    if (transactionFuncName === 'controlChanges') {
      const args = transaction.getDataArgs();
      if (args && args.length > 0) {
        const tokenIdentifier = BinaryUtils.hexToString(args[0]);
        this.logger.log(`Invalidating token properties for token ${tokenIdentifier}`);
        return await this.cachingService.deleteInCache(`tokenProperties:${tokenIdentifier}`);
      }
    }

    return [];
  }

  async tryInvalidateOwner(transaction: ShardTransaction): Promise<string[]> {
    const transactionFuncName = transaction.getDataFunctionName();
    if (transactionFuncName !== 'mergeValidatorToDelegationWithWhitelist' && transactionFuncName !== 'makeNewContractFromValidatorData') {
      return [];
    }

    return await this.nodeService.deleteOwnersForAddressInCache(transaction.sender);
  }

  async tryInvalidateCollectionProperties(transaction: ShardTransaction): Promise<string[]> {
    if (!transaction.data) {
      return [];
    }

    const tryExtractSftChange = new SftChangeTransactionExtractor();
    const collectionIdentifier = tryExtractSftChange.extract(transaction);
    if (!collectionIdentifier) {
      return [];
    }

    const tryExtractTransferOwnership: TransactionExtractorInterface<{ identifier: string; }> = new TransferOwnershipExtractor();
    const metadataTransferOwnership = tryExtractTransferOwnership.extract(transaction);
    if (metadataTransferOwnership) {
      this.logger.log(`Detected NFT Transfer ownership for collection with identifier '${metadataTransferOwnership.identifier}'`);
      const key = CacheInfo.EsdtProperties(collectionIdentifier).key;
      await this.cachingService.deleteInCache(key);

      return [key];
    }

    return [];
  }

  async tryInvalidateStakeTopup(transaction: ShardTransaction): Promise<string[]> {
    if (!transaction.data) {
      return [];
    }

    const transactionFuncName = transaction.getDataFunctionName();
    if (!transactionFuncName) {
      return [];
    }

    if (!transactionFuncName.in(StakeFunction.delegate, StakeFunction.unDelegate, StakeFunction.reDelegateRewards)) {
      return [];
    }

    await this.cachingService.deleteInCache(CacheInfo.StakeTopup(transaction.receiver).key);

    return [CacheInfo.StakeTopup(transaction.receiver).key];
  }
}
