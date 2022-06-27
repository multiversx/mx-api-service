import { BinaryUtils } from "@elrondnetwork/nestjs-microservice-common";
import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { TransactionExtractorInterface } from "./transaction.extractor.interface";

export class SftChangeTransactionExtractor implements TransactionExtractorInterface<string> {
  extract(transaction: ShardTransaction) {
    if (transaction.getDataFunctionName() !== 'changeSFTToMetaESDT') {
      return undefined;
    }

    const args = transaction.getDataArgs();
    if (!args || args.length === 0) {
      return undefined;
    }

    const collectionIdentifierHex = args[0];

    try {
      return BinaryUtils.hexToString(collectionIdentifierHex);
    } catch (error: any) {
      const logger = new Logger(SftChangeTransactionExtractor.name);
      logger.error(`Error in tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction function. Could not convert hex '${collectionIdentifierHex}' to string`);
      logger.error(error);
      return undefined;
    }
  }
}
