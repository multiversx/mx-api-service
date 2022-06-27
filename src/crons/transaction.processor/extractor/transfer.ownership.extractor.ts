import { BinaryUtils } from "@elrondnetwork/nestjs-microservice-common";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { TransactionExtractorInterface } from "./transaction.extractor.interface";

export class TransferOwnershipExtractor implements TransactionExtractorInterface<{ identifier: string }> {
  extract(transaction: ShardTransaction) {
    if (transaction.getDataFunctionName() !== 'transferOwnership') {
      return undefined;
    }

    const args = transaction.getDataArgs();
    if (!args || args.length < 2) {
      return undefined;
    }

    const collectionHex = args[0];
    const addressHex = args[1];

    let collection: string = '';
    //@ts-ignore
    let address: string = '';

    try {
      collection = BinaryUtils.hexToString(collectionHex);
    } catch (error: any) {
      const logger = new Logger(TransferOwnershipExtractor.name);
      logger.error(`Error in tryExtractTransferOwnership function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    try {
      address = BinaryUtils.hexToString(addressHex);
    } catch (error: any) {
      const logger = new Logger(TransferOwnershipExtractor.name);
      logger.error(`Error in tryExtractTransferOwnership function. Could not convert address hex '${addressHex}' to string`);
      logger.error(error);
      return undefined;
    }

    const identifier = `${collection}`;
    return { identifier };
  }
}
