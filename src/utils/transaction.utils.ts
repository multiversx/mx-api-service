import { ShardTransaction } from "@elrondnetwork/transaction-processor";
import { Logger } from "@nestjs/common";
import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { BinaryUtils } from "./binary.utils";

export class TransactionUtils {
  static tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction(transaction: ShardTransaction): string | undefined {
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
      const logger = new Logger(TransactionUtils.name);
      logger.error(`Error in tryExtractCollectionIdentifierFromChangeSftToMetaEsdTransaction function. Could not convert hex '${collectionIdentifierHex}' to string`);
      logger.error(error);
      return undefined;
    }
  }

  static tryExtractNftMetadataFromNftCreateTransaction(transaction: ShardTransaction): { collection: string, attributes: string } | undefined {
    if (transaction.getDataFunctionName() !== 'ESDTNFTCreate') {
      return undefined;
    }

    const args = transaction.getDataArgs();
    if (!args || args.length < 6) {
      return undefined;
    }

    const collectionHex = args[0];
    const attributesHex = args[5];

    let collection: string = '';
    let attributes: string = '';

    try {
      collection = BinaryUtils.hexToString(collectionHex);
    } catch (error: any) {
      const logger = new Logger(TransactionUtils.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert collection hex '${collectionHex}' to string`);
      logger.error(error);
      return undefined;
    }

    try {
      attributes = BinaryUtils.hexToString(attributesHex);
    } catch (error: any) {
      const logger = new Logger(TransactionUtils.name);
      logger.error(`Error in tryExtractNftMetadataFromNftCreateTransaction function. Could not convert attributes hex '${attributesHex}' to string`);
      logger.error(error);
      return undefined;
    }

    return { collection, attributes };
  }

  static isTransactionCountQueryWithAddressOnly(filter: TransactionFilter, address?: string) {
    if (!address) {
      return false;
    }

    const filterToCompareWith: TransactionFilter = {};

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }

  static isTransactionCountQueryWithSenderAndReceiver(filter: TransactionFilter) {
    if (!filter.sender || !filter.receiver) {
      return false;
    }

    if (filter.sender !== filter.receiver) {
      return false;
    }

    const filterToCompareWith: TransactionFilter = {
      sender: filter.sender,
      receiver: filter.receiver,
      condition: QueryConditionOptions.should,
    };

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }
}