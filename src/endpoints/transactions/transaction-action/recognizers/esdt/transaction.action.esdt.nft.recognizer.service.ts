import { Injectable } from "@nestjs/common";
import { TokenTransferProperties } from "src/endpoints/tokens/entities/token.transfer.properties";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { NumberUtils } from "src/utils/number.utils";
import { StringUtils } from "src/utils/string.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionMetadataTransfer } from "../../entities/transaction.metadata.transfer";
import { TransactionActionRecognizerInterface } from "../../transaction.action.recognizer.interface";

@Injectable()
export class TransactionActionEsdtNftRecognizerService implements TransactionActionRecognizerInterface {
  constructor() { }

  // eslint-disable-next-line require-await
  async recognize(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    const multiTransfers = metadata.transfers;
    if (!multiTransfers) {
      return undefined;
    }

    const result = new TransactionAction();
    result.category = TransactionActionCategory.esdtNft;
    result.name = 'transfer';
    result.description = `Transfer ${multiTransfers.map(x => this.getMultiTransferDescription(x)).filter(x => x !== undefined).join(', ')} to ${metadata.receiver}`;
    result.arguments = {
      transfers: multiTransfers.map(x => this.getNftTransferDetails(x)).filter(x => x !== undefined),
      receiver: metadata.receiver,
      functionName: metadata.functionName && StringUtils.isFunctionName(metadata.functionName) ? metadata.functionName : undefined,
      functionArgs: metadata.functionArgs && metadata.functionArgs.all(x => StringUtils.isHex(x)) ? metadata.functionArgs : undefined,
    };

    return result;
  }

  private getNftTransferDetails(transfer: TransactionMetadataTransfer): any {
    const properties = transfer.properties;
    if (properties) {
      return {
        ...properties,
        value: transfer.value.toString(),
      };
    }

    return undefined;
  }

  private getMultiTransferDescription(transfer: TransactionMetadataTransfer): string | undefined {
    const properties = transfer.properties;
    if (!properties) {
      return undefined;
    }

    if (properties.type === 'FungibleESDT') {
      return this.getTokenTransferDescription(properties, transfer.value);
    } else {
      return this.getNftTransferDescription(properties, transfer.value);
    }
  }

  private getTokenTransferDescription(properties: TokenTransferProperties, value: BigInt): string {
    const denominatedValue = NumberUtils.toDenominatedString(value, properties.decimals);
    return `${denominatedValue} ${properties.name} (${properties.ticker})`;
  }

  private getNftTransferDescription(properties: TokenTransferProperties, value: BigInt): string {
    switch (properties.type) {
      case TokenType.MetaESDT:
        const denominatedValue = NumberUtils.toDenominatedString(value, properties.decimals);
        return `${denominatedValue} ${properties.name} (${properties.identifier})`;
      case TokenType.NonFungibleESDT:
        return `NFT of collection ${properties.name} (${properties.identifier})`;
      case TokenType.SemiFungibleESDT:
        return `quantity ${value.toString()} for NFT of collection ${properties.name} (${properties.identifier})`;
      default:
        return 'Unknown';
    }
  }
}
