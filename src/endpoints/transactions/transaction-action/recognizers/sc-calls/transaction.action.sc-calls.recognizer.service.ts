import { Injectable } from "@nestjs/common";
import { AddressUtils } from "src/utils/address.utils";
import { TransactionAction } from "../../entities/transaction.action";
import { TransactionActionCategory } from "../../entities/transaction.action.category";
import { TransactionMetadata } from "../../entities/transaction.metadata";
import { TransactionActionRecognizerInterface } from "../../transaction.action.recognizer.interface";

@Injectable()
export class SCCallActionRecognizerService implements TransactionActionRecognizerInterface {
  constructor(
  ) { }

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
    if (!AddressUtils.isSmartContractAddress(metadata.receiver)) {
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
}
