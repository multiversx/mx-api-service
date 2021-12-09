import { Injectable, Logger } from "@nestjs/common";
import { CachingService } from "src/common/caching/caching.service";
import { CacheInfo } from "src/common/caching/entities/cache.info";
import { BinaryUtils } from "src/utils/binary.utils";
import { Constants } from "src/utils/constants";
import { EsdtService } from "../esdt/esdt.service";
import { NftFilter } from "../nfts/entities/nft.filter";
import { NftService } from "../nfts/nft.service";
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
    private readonly nftService: NftService,
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
        switch (event.identifier) {
          case TransactionLogEventIdentifier.ESDTNFTTransfer:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTNFTBurn:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTNFTAddQuantity:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.addQuantity));
            break;
          case TransactionLogEventIdentifier.ESDTNFTCreate:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.create));
            break;
          case TransactionLogEventIdentifier.MultiESDTNFTTransfer:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.multiTransfer));
            break;
          case TransactionLogEventIdentifier.ESDTTransfer:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.transfer));
            break;
          case TransactionLogEventIdentifier.ESDTBurn:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.burn));
            break;
          case TransactionLogEventIdentifier.ESDTLocalMint:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localMint));
            break;
          case TransactionLogEventIdentifier.ESDTLocalBurn:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.localBurn));
            break;
          case TransactionLogEventIdentifier.ESDTWipe:
            operations.push(await this.getTransactionNftOperation(txHash, log, event, TransactionOperationAction.wipe));
            break;
        }
      }
    }

    return operations.filter(operation => operation !== undefined).map(operation => operation!);
  }

  private async getTransactionNftOperation(txHash: string, log: TransactionLog, event: TransactionLogEvent, action: TransactionOperationAction): Promise<TransactionOperation | undefined> {
    try {
      let identifier = BinaryUtils.base64Decode(event.topics[0]);
      let nonce = BinaryUtils.tryBase64ToHex(event.topics[1]);
      let value = BinaryUtils.tryBase64ToBigInt(event.topics[2])?.toString() ?? '0';
      let receiver = BinaryUtils.tryBase64ToAddress(event.topics[3]) ?? log.address;
      let { decimals } = await this.getTokenTransferProperties(identifier, nonce) || {};

      let collection: string | undefined = undefined;
      if (nonce) {
        collection = identifier;
        identifier = `${collection}-${nonce}`
      }

      let type = nonce ? TransactionOperationType.nft : TransactionOperationType.esdt;

      return { action, type, collection, identifier, sender: event.address, receiver, value, decimals };
    } catch (error) {
      this.logger.error(`Error when parsing NFT transaction log for tx hash '${txHash}' with action '${action}' and topics: ${event.topics}`);
      this.logger.error(error);
      return undefined;
    }
  }

  async getTokenTransferProperties(identifier: string, nonce?: string): Promise<TokenTransferProperties | null> {
    let key = CacheInfo.TransactionActionProperties(identifier).key;
    if (nonce) {
      key = CacheInfo.TransactionActionProperties(`${identifier}-${nonce}`).key;
    }

    return this.cachingService.getOrSetCache(
      key,
      async () => await this.getTokenTransferPropertiesRaw(identifier, nonce),
      Constants.oneDay()
    );
  }

  private async getTokenTransferPropertiesRaw(identifier: string, nonce?: string): Promise<TokenTransferProperties | null> {
    let properties = await this.esdtService.getEsdtTokenProperties(identifier);
    if (!properties) {
      return null;
    }

    let assets = await this.tokenAssetService.getAssets(identifier);

    let name = properties.name;
    if (['NonFungibleESDT', 'SemiFungibleESDT'].includes(properties.type)) {
      let nfts = await this.nftService.getNftsInternal(0, 1, new NftFilter(), identifier);
      if (nfts.length > 0) {
        name = nfts[0].name;
      }
    }

    return {
      type: properties.type,
      name,
      collection: properties.type !== 'FungibleESDT' ? identifier : undefined,
      identifier: properties.type !== 'FungibleESDT' ? identifier + '-' + nonce : undefined,
      token: properties.type === 'FungibleESDT' ? identifier : undefined,
      ticker: assets ? identifier.split('-')[0] : identifier,
      decimals: ['FungibleESDT', 'MetaESDT'].includes(properties.type) || !nonce ? properties.decimals : undefined
    }
  }
}