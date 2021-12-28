import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { EsdtService } from "../esdt/esdt.service";
import { TokenAssetService } from "./token.asset.service";
import { TokenTransferProperties } from "./entities/token.transfer.properties";
import { TransactionLog } from "../transactions/entities/transaction.log";
import { TransactionLogEvent } from "../transactions/entities/transaction.log.event";
import { TransactionLogEventIdentifier } from "../transactions/entities/transaction.log.event.identifier";
import { TransactionOperation } from "../transactions/entities/transaction.operation";
import { TransactionOperationAction } from "../transactions/entities/transaction.operation.action";
import { TransactionOperationType } from "../transactions/entities/transaction.operation.type";

@Injectable()
export class TokenTransferService {
  private readonly logger: Logger

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

  async getOperationsForTransactionLogs(txHash: string, logs: TransactionLog[]): Promise<TransactionOperation[]> {
    let operations: (TransactionOperation | undefined)[] = [];

    for (let log of logs) {
      for (let event of log.events) {
        let action = this.getOperationAction(event.identifier);
        if (action) {
          let operation = await this.getTransactionNftOperation(txHash, log, event, action);

          operations.push(operation);
        }
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation!);
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
      default:
        return null;
    }
  }

  private async getTransactionNftOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): Promise<TransactionOperation | undefined> {
    try {
      let identifier = BinaryUtils.base64Decode(event.topics[0]);
      let nonce = BinaryUtils.tryBase64ToHex(event.topics[1]);
      let value = BinaryUtils.tryBase64ToBigInt(event.topics[2])?.toString() ?? '0';
      let receiver = BinaryUtils.tryBase64ToAddress(event.topics[3]) ?? log.address;
      let properties = await this.getTokenTransferProperties(identifier, nonce);
      let decimals = properties ? properties.decimals : undefined;
      let name = properties ? properties.name : undefined;
      let esdtType = properties ? properties.type : undefined;

      let collection: string | undefined = undefined;
      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`
      }

      let type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

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
      Constants.oneDay()
    );

    if (properties && nonce) {
      properties.identifier = `${identifier}-${nonce}`;
    }

    return properties;
  }

  private async getTokenTransferPropertiesRaw(identifier: string): Promise<TokenTransferProperties | null> {
    let properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return null;
    }

    let assets = await this.tokenAssetService.getAssets(identifier);

    let result: TokenTransferProperties = {
      type: properties.type,
      name: properties.name,
      ticker: assets ? identifier.split('-')[0] : identifier,
    }

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