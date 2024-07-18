import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { CacheInfo } from "src/utils/cache.info";
import { EsdtService } from "../esdt/esdt.service";
import { AssetsService } from "../../common/assets/assets.service";
import { TokenTransferProperties } from "./entities/token.transfer.properties";
import { TransactionLog } from "../transactions/entities/transaction.log";
import { TransactionLogEventIdentifier } from "../transactions/entities/transaction.log.event.identifier";
import { TransactionOperation } from "../transactions/entities/transaction.operation";
import { TransactionOperationAction } from "../transactions/entities/transaction.operation.action";
import { TransactionLogEvent } from "../transactions/entities/transaction.log.event";
import { TransactionOperationType } from "../transactions/entities/transaction.operation.type";
import { SmartContractResult } from "../sc-results/entities/smart.contract.result";
import { TransactionDetailed } from "../transactions/entities/transaction.detailed";
import { BinaryUtils } from "@multiversx/sdk-nestjs-common";
import { CacheService } from "@multiversx/sdk-nestjs-cache";
import { OriginLogger } from "@multiversx/sdk-nestjs-common";
import { DataApiService } from "src/common/data-api/data-api.service";
import BigNumber from "bignumber.js";
import { EsdtType } from "../esdt/entities/esdt.type";

@Injectable()
export class TokenTransferService {
  private readonly logger = new OriginLogger(TokenTransferService.name);

  constructor(
    private readonly cachingService: CacheService,
    @Inject(forwardRef(() => EsdtService))
    private readonly esdtService: EsdtService,
    private readonly assetsService: AssetsService,
    private readonly dataApiService: DataApiService
  ) { }

  getTokenTransfer(elasticTransaction: any): { tokenIdentifier: string, tokenAmount: string } | undefined {
    if (!elasticTransaction.data) {
      return undefined;
    }

    const tokens = elasticTransaction.tokens;
    if (!tokens || tokens.length === 0) {
      return undefined;
    }

    const esdtValues = elasticTransaction.esdtValues;
    if (!esdtValues || esdtValues.length === 0) {
      return undefined;
    }

    const decodedData = BinaryUtils.base64Decode(elasticTransaction.data);
    if (!decodedData.startsWith('ESDTTransfer@')) {
      return undefined;
    }

    const token = tokens[0];
    const esdtValue = esdtValues[0];

    return { tokenIdentifier: token, tokenAmount: esdtValue };
  }

  private async getTokenTransferPropertiesFromLogs(logs: TransactionLog[]): Promise<{ [key: string]: TokenTransferProperties | null }> {
    const identifiers: string[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        const action = this.getOperationEsdtActionByEventIdentifier(event.identifier);
        if (action) {
          identifiers.push(BinaryUtils.base64Decode(event.topics[0]));
        }

        if (event.identifier === TransactionLogEventIdentifier.MultiESDTNFTTransfer) {
          for (let i = 1; i < (event.topics.length - 1) / 3; i++) {
            identifiers.push(BinaryUtils.base64Decode(event.topics[i * 3]));
          }
        }
      }
    }

    const tokenProperties: {
      [key: string]: TokenTransferProperties | null;
    } = {};

    await this.cachingService.batchApplyAll(
      identifiers,
      identifier => CacheInfo.TokenTransferProperties(identifier).key,
      identifier => this.getTokenTransferPropertiesRaw(identifier),
      (identifier, value) => tokenProperties[identifier] = value,
      CacheInfo.TokenTransferProperties('').ttl
    );

    return tokenProperties;
  }

  async getOperationsForTransaction(transaction: TransactionDetailed, logs: TransactionLog[]): Promise<TransactionOperation[]> {
    const scResultsOperations: TransactionOperation[] = this.getOperationsForTransactionScResults(transaction.results ?? []);
    const logsOperations: TransactionOperation[] = await this.getOperationsForTransactionLogs(transaction.txHash, logs, transaction.sender);

    return [...scResultsOperations, ...logsOperations];
  }


  private getOperationsForTransactionScResults(scResults: SmartContractResult[]): TransactionOperation[] {
    if (!scResults.length) {
      return [];
    }

    const operations: TransactionOperation[] = [];
    for (const scResult of scResults) {
      if (scResult.nonce !== 0 || scResult.value === undefined || scResult.value === '0') {
        continue;
      }

      const operation = new TransactionOperation();
      operation.action = TransactionOperationAction.transfer;
      operation.type = TransactionOperationType.egld;
      operation.id = scResult.hash;
      operation.sender = scResult.sender;
      operation.receiver = scResult.receiver;
      operation.value = scResult.value;

      operations.push(operation);
    }

    return operations;
  }

  async getOperationsForTransactionLogs(txHash: string, logs: TransactionLog[], sender: string): Promise<TransactionOperation[]> {
    if (!logs.length) {
      return [];
    }

    const tokensProperties = await this.getTokenTransferPropertiesFromLogs(logs);

    const operations: TransactionOperation[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        let operation;
        if (event.identifier === TransactionOperationAction.writeLog || event.identifier === TransactionOperationAction.signalError) {
          operation = this.getTransactionLogOperation(log, event, event.identifier, sender);
        } else if (event.identifier === TransactionOperationAction.transferValueOnly) {
          operation = this.getTransactionTransferValueOperation(txHash, log, event, event.identifier);
        }

        if (!operation) {
          const action = this.getOperationEsdtActionByEventIdentifier(event.identifier);
          if (action) {
            if (event.identifier === TransactionLogEventIdentifier.MultiESDTNFTTransfer) {
              const multiESDTNFTOperations = this.getTransactionMultiESDTNFTOperations(txHash, log, event.address, event.topics, action, tokensProperties);
              operations.push(...multiESDTNFTOperations);
            } else {
              operation = this.getTransactionNftOperation(txHash, log, event.address, event.topics, action, tokensProperties);
            }
          }
        }

        if (operation) {
          operation.additionalData = event.additionalData;
          operations.push(operation);
        }
      }
    }

    return operations;
  }

  private getTransactionLogOperation(log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction, receiver: string): TransactionOperation {
    const operation = new TransactionOperation();
    operation.id = log.id ?? '';
    operation.action = action;

    if (action === TransactionOperationAction.writeLog) {
      operation.type = TransactionOperationType.log;
    }
    if (action === TransactionOperationAction.signalError) {
      operation.type = TransactionOperationType.error;
    }

    operation.sender = event.address;
    operation.receiver = receiver;

    if (event.data) {
      operation.data = BinaryUtils.base64Decode(event.data);
    }

    if (event.topics && event.topics.length > 1 && event.topics[1]) {
      operation.message = BinaryUtils.base64Decode(event.topics[1]);
    }

    return operation;
  }

  private getOperationEsdtActionByEventIdentifier(identifier: string): TransactionOperationAction | null {
    switch (identifier) {
      case TransactionLogEventIdentifier.ESDTNFTTransfer:
        return TransactionOperationAction.transfer;
      case TransactionLogEventIdentifier.ESDTNFTBurn:
        return TransactionOperationAction.burn;
      case TransactionLogEventIdentifier.ESDTNFTAddQuantity:
        return TransactionOperationAction.addQuantity;
      case TransactionLogEventIdentifier.ESDTNFTCreate:
        return TransactionOperationAction.create;
      case TransactionLogEventIdentifier.MultiESDTNFTTransfer:
        return TransactionOperationAction.transfer;
      case TransactionLogEventIdentifier.ESDTTransfer:
        return TransactionOperationAction.transfer;
      case TransactionLogEventIdentifier.ESDTBurn:
        return TransactionOperationAction.burn;
      case TransactionLogEventIdentifier.ESDTLocalMint:
        return TransactionOperationAction.localMint;
      case TransactionLogEventIdentifier.ESDTLocalBurn:
        return TransactionOperationAction.localBurn;
      case TransactionLogEventIdentifier.ESDTWipe:
        return TransactionOperationAction.wipe;
      case TransactionLogEventIdentifier.ESDTFreeze:
        return TransactionOperationAction.freeze;
      default:
        return null;
    }
  }

  private getTransactionMultiESDTNFTOperations(txHash: string, log: TransactionLog, address: string, topics: string[], action: TransactionOperationAction, tokensProperties: { [key: string]: TokenTransferProperties | null }): TransactionOperation[] {
    const operations: TransactionOperation[] = [];

    const receiverTopic = topics.last();
    for (let i = 0; i < (topics.length - 1) / 3; i++) {
      const eventTopics = [
        topics[i * 3],
        topics[i * 3 + 1],
        topics[i * 3 + 2],
        receiverTopic,
      ];

      const operation = this.getTransactionNftOperation(txHash, log, address, eventTopics, action, tokensProperties);
      if (operation) {
        operations.push(operation);
      }
    }

    return operations;
  }

  private getTransactionNftOperation(txHash: string, log: TransactionLog, address: string, topics: string[], action: TransactionOperationAction, tokensProperties: { [key: string]: TokenTransferProperties | null }): TransactionOperation | undefined {
    try {
      let identifier = BinaryUtils.base64Decode(topics[0]);
      const nonce = BinaryUtils.tryBase64ToHex(topics[1]);
      const value = BinaryUtils.tryBase64ToBigInt(topics[2])?.toString();
      const receiver = BinaryUtils.tryBase64ToAddress(topics[3]) ?? log.address;
      const properties = tokensProperties[identifier];
      const decimals = properties ? properties.decimals : undefined;
      const name = properties ? properties.name : undefined;
      const esdtType = properties ? properties.type : undefined;
      const svgUrl = properties ? properties.svgUrl : undefined;
      const ticker = properties ? properties.ticker : undefined;

      let collection: string | undefined = undefined;

      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`;
      }

      const type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

      return { id: log.id ?? '', action, type, esdtType, collection, identifier, ticker, name, sender: address, receiver, value, decimals, svgUrl, senderAssets: undefined, receiverAssets: undefined };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${topics}`);
      this.logger.error(error);
      return undefined;
    }
  }

  private getTransactionTransferValueOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): TransactionOperation | undefined {
    try {
      let sender: string;
      let receiver: string;
      let value: string;

      if (event.topics.length === 2) {
        sender = event.address;
        receiver = BinaryUtils.base64ToAddress(event.topics[1]);
        value = BinaryUtils.base64ToBigInt(event.topics[0]).toString();
      } else if (event.topics.length === 3) {
        sender = BinaryUtils.base64ToAddress(event.topics[0]);
        receiver = BinaryUtils.base64ToAddress(event.topics[1]);
        value = BinaryUtils.base64ToBigInt(event.topics[2]).toString();
      } else {
        throw new Error(`Unrecognized topic count when interpreting transferValue event`);
      }

      const operation = new TransactionOperation();
      operation.id = log.id ?? '';
      operation.action = TransactionOperationAction.transfer;
      operation.type = TransactionOperationType.egld;
      operation.sender = sender;
      operation.receiver = receiver;
      operation.value = value;

      return operation;
    } catch (error) {
      this.logger.error(`Error when parsing valueTransferOnly transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getTokenTransferProperties(options: { identifier: string, nonce?: string, timestamp?: number, value?: string, applyValue?: boolean }): Promise<TokenTransferProperties | null> {
    let properties = await this.cachingService.getOrSet(
      CacheInfo.TokenTransferProperties(options.identifier).key,
      async () => await this.getTokenTransferPropertiesRaw(options.identifier),
      CacheInfo.TokenTransferProperties(options.identifier).ttl,
    );

    // we clone it since we alter the resulting object 
    properties = JSON.parse(JSON.stringify(properties));

    if (properties && properties.type !== EsdtType.FungibleESDT && options.nonce) {
      properties.identifier = `${options.identifier}-${options.nonce}`;
    }

    if (properties && options.applyValue && options.timestamp && options.value) {
      const esdtPrice = await this.dataApiService.getEsdtTokenPrice(options.identifier, options.timestamp);
      if (esdtPrice) {
        properties.valueUsd = new BigNumber(esdtPrice).multipliedBy(options.value).shiftedBy(-(properties.decimals ?? 0)).toNumber();

        const egldPrice = await this.dataApiService.getEgldPrice(options.timestamp);
        if (egldPrice) {
          properties.valueEgld = properties.valueUsd / egldPrice;
        }
      }
    }

    return properties;
  }

  async getTokenTransferPropertiesRaw(identifier: string): Promise<TokenTransferProperties | null> {
    const properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return null;
    }

    const assets = await this.assetsService.getTokenAssets(identifier);

    const result: TokenTransferProperties = {
      type: properties.type,
      name: assets?.name ?? properties.name,
      ticker: assets ? identifier.split('-')[0] : identifier,
      svgUrl: assets?.svgUrl ?? '',
    };

    if (properties.type === 'FungibleESDT') {
      result.token = identifier;
    } else {
      result.collection = identifier;
    }

    if (['FungibleESDT', 'MetaESDT'].includes(properties.type)) {
      result.decimals = properties.decimals;
    }

    return result;
  }
}
