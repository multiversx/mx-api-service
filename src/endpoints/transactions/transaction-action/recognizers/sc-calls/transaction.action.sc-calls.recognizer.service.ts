import { Injectable } from "@nestjs/common";
import { AddressUtils } from "src/utils/address.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionRecognizerInterface } from "../../transaction.action.recognizer.interface";

@Injectable()
export class SCCallActionRecognizerService implements TransactionActionRecognizerInterface {
  private builtInSelfFunctions = [
    'ESDTLocalMint',
    'ESDTLocalBurn',
    'ESDTNFTCreate',
    'ESDTNFTAddQuantity',
    'ESDTNFTAddURI',
    'ESDTNFTUpdateAttributes',
  ];

  // eslint-disable-next-line require-await
  async recognize(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    return this.getSCDeployAction(metadata) ?? this.getSCCallAction(metadata);
  }

  private getSCDeployAction(metadata: TransactionMetadata): TransactionAction | undefined {
    if (metadata.receiver !== 'erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu') {
      return undefined;
    }

    const result = new TransactionAction();
    result.category = TransactionActionCategory.scCall;
    result.name = 'deploy';
    result.description = 'Smart contract deployment';

    return result;
  }

  private getSCCallAction(metadata: TransactionMetadata): TransactionAction | undefined {
    if (!this.isSmartContractCall(metadata)) {
      return undefined;
    }

    if (!metadata.functionName) {
      return undefined;
    }

    const result = new TransactionAction();
    result.category = TransactionActionCategory.scCall;
    if (metadata.functionName) {
      result.name = metadata.functionName;
    }

    return result;
  }

  private isSmartContractCall(metadata: TransactionMetadata): boolean {
    return AddressUtils.isSmartContractAddress(metadata.receiver) || this.isSelfBuiltInFunctionCall(metadata);
  }

  private isSelfBuiltInFunctionCall(metadata: TransactionMetadata): boolean {
    return metadata.sender === metadata.receiver && this.builtInSelfFunctions.includes(metadata.functionName ?? '');
  }
}
