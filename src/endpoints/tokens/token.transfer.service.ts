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
import { BinaryUtils, CachingService } from "@elrondnetwork/erdnest";
import { OriginLogger } from "@elrondnetwork/erdnest";

@Injectable()
export class TokenTransferService {
  private readonly logger = new OriginLogger(TokenTransferService.name);

  constructor(
    private readonly cachingService: CachingService,
    @Inject(forwardRef(() => EsdtService))
    private readonly esdtService: EsdtService,
    private readonly assetsService: AssetsService
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
      }
    }

    const tokenProperties: {
      [key: string]: TokenTransferProperties | null
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
            operation = this.getTransactionNftOperation(txHash, log, event, action, tokensProperties);
          }
        }

        if (operation) {
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

    if (event.topics.length > 1 && event.topics[1]) {
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

  private getTransactionNftOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction, tokensProperties: { [key: string]: TokenTransferProperties | null }): TransactionOperation | undefined {
    try {
      let identifier = BinaryUtils.base64Decode(event.topics[0]);
      const nonce = BinaryUtils.tryBase64ToHex(event.topics[1]);
      const value = BinaryUtils.tryBase64ToBigInt(event.topics[2])?.toString();
      const receiver = BinaryUtils.tryBase64ToAddress(event.topics[3]) ?? log.address;
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

      return { id: log.id ?? '', action, type, esdtType, collection, identifier, ticker, name, sender: event.address, receiver, value, decimals, svgUrl, senderAssets: undefined, receiverAssets: undefined };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
      this.logger.error(error);
      return undefined;
    }
  }

  private getTransactionTransferValueOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): TransactionOperation | undefined {
    try {
      const sender = BinaryUtils.base64ToAddress(event.topics[0]);
      const receiver = BinaryUtils.base64ToAddress(event.topics[1]);
      const value = BinaryUtils.base64ToBigInt(event.topics[2]).toString();

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

  async getTokenTransferProperties(identifier: string, nonce?: string): Promise<TokenTransferProperties | null> {
    let properties = await this.cachingService.getOrSetCache(
      CacheInfo.TokenTransferProperties(identifier).key,
      async () => await this.getTokenTransferPropertiesRaw(identifier),
      CacheInfo.TokenTransferProperties(identifier).ttl,
    );

    // we clone it since we alter the resulting object 
    properties = JSON.parse(JSON.stringify(properties));

    if (properties && nonce) {
      properties.identifier = `${identifier}-${nonce}`;
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
      name: properties.name,
      ticker: assets ? identifier.split('-')[0] : identifier,
      svgUrl: assets ? assets.svgUrl : '',
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
