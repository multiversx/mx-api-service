import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { BinaryUtils } from "src/utils/binary.utils";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAssetService } from "./token.asset.service";
import { TokenTransferProperties } from "./entities/token.transfer.properties";
import { TransactionLog } from "../transactions/entities/transaction.log";
import { TransactionLogEventIdentifier } from "../transactions/entities/transaction.log.event.identifier";
import { TransactionOperation } from "../transactions/entities/transaction.operation";
import { TransactionOperationAction } from "../transactions/entities/transaction.operation.action";
import { RecordUtils } from "src/utils/record.utils";
import { TransactionLogEvent } from "../transactions/entities/transaction.log.event";
import { TransactionOperationType } from "../transactions/entities/transaction.operation.type";
import { SmartContractResult } from "../sc-results/entities/smart.contract.result";

@Injectable()
export class TokenTransferService {
  private readonly logger: Logger;

  constructor(
    private readonly cachingService: CachingService,
    private readonly esdtService: EsdtService,
    private readonly tokenAssetService: TokenAssetService
  ) {
    this.logger = new Logger(TokenTransferService.name);
  }

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
        const action = this.getOperationAction(event.identifier);
        if (action) {
          identifiers.push(BinaryUtils.base64Decode(event.topics[0]));
        }
      }
    }

    const tokenProperties: {
      [key: string]: TokenTransferProperties | null
    } = {};

    await this.cachingService.batchApply(
      identifiers,
      identifier => CacheInfo.TokenTransferProperties(identifier).key,
      async identifiers => {

        const result: { [key: string]: TokenTransferProperties | null } = {};
        for (const identifier of identifiers) {
          const value = await this.getTokenTransferPropertiesRaw(identifier);
          result[identifier] = value;
        }

        return RecordUtils.mapKeys(result, identifier => CacheInfo.TokenTransferProperties(identifier).key);
      },
      (identifier, value) => tokenProperties[identifier] = value,
      CacheInfo.TokenTransferProperties('').ttl
    );

    return tokenProperties;
  }


  async getOperationsForTransactionLogs(txHash: string, logs: TransactionLog[]): Promise<TransactionOperation[]> {
    const tokensProperties = await this.getTokenTransferPropertiesFromLogs(logs);

    const operations: (TransactionOperation | undefined)[] = [];
    for (const log of logs) {
      for (const event of log.events) {
        const action = this.getOperationAction(event.identifier);
        if (action) {
          const operation = this.getTransactionNftOperation(txHash, log, event, action, tokensProperties);

          operations.push(operation);
        }
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation ?? new TransactionOperation());
  }

  async getOperationsForFreezeFromScResults(scresults: SmartContractResult[]): Promise<TransactionOperation[]> {
    if (scresults.length === 0) {
      return [];
    }

    const operations: (TransactionOperation | undefined)[] = [];

    for (const scresult of scresults) {
      const data = BinaryUtils.base64Decode(scresult.data);

      const operationIdentifier = data.split('@')[0];
      const action = this.getOperationAction(operationIdentifier);
      if (action) {
        const tokenIdentifier = BinaryUtils.hexToString(data.split('@')[1]);
        const properties = await this.getTokenTransferProperties(tokenIdentifier);

        const operation = new TransactionOperation();
        operation.action = action;
        operation.identifier = tokenIdentifier;
        operation.type = TransactionOperationType.esdt;
        operation.esdtType = properties?.type;
        operation.collection = tokenIdentifier;
        operation.name = properties?.name;
        operation.decimals = properties?.decimals;
        operation.receiver = scresult.receiver;

        operations.push(operation);
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation ?? new TransactionOperation());
  }

  private getOperationAction(identifier: string): TransactionOperationAction | null {
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
        return TransactionOperationAction.multiTransfer;
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

      let collection: string | undefined = undefined;
      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`;
      }

      const type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

      return { action, type, esdtType, collection, identifier, name, sender: event.address, receiver, value, decimals };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
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

    const assets = await this.tokenAssetService.getAssets(identifier);

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
