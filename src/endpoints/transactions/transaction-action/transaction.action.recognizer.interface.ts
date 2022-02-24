import { TransactionAction } from "./entities/transaction.action";
import { TransactionMetadata } from "./entities/transaction.metadata";

export class TransactionActionRecognizerInterface {
  // @ts-ignore
  // eslint-disable-next-line require-await
  async recognize(metadata: TransactionMetadata): Promise<TransactionAction | undefined> {
    return undefined;
  }
}
