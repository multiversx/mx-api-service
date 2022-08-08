import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";
import { TransactionOperationAction } from "src/endpoints/transactions/entities/transaction.operation.action";
import '@elrondnetwork/erdnest/lib/utils/extensions/array.extensions';
import { QueryConditionOptions } from "@elrondnetwork/erdnest";

export class TransactionUtils {
  static isTransactionCountQueryWithAddressOnly(filter: TransactionFilter, address?: string) {
    if (!address) {
      return false;
    }

    const filterToCompareWith: TransactionFilter = {};

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }

  static isTransactionCountQueryWithSenderAndReceiver(filter: TransactionFilter) {
    if (!filter.sender || !filter.receivers) {
      return false;
    }

    if (!filter.receivers.includes(filter.sender)) {
      return false;
    }

    const filterToCompareWith: TransactionFilter = {
      sender: filter.sender,
      receivers: filter.receivers,
      condition: QueryConditionOptions.should,
    };

    return JSON.stringify(filter) === JSON.stringify(filterToCompareWith);
  }

  static trimOperations(sender: string, operations: TransactionOperation[], previousHashes: Record<string, string>): TransactionOperation[] {
    let result: TransactionOperation[] = [];

    for (const operation of operations) {
      if (operation.action === TransactionOperationAction.transfer) {
        const identicalOperations = operations.filter(x =>
          x.sender === operation.sender &&
          x.receiver === operation.receiver &&
          x.collection === operation.collection &&
          x.identifier === operation.identifier &&
          x.type === operation.type &&
          x.value === operation.value &&
          x.action === TransactionOperationAction.transfer &&
          x.id === previousHashes[operation.id]
        );

        if (identicalOperations.length > 0) {
          continue;
        }
      }

      result.push(operation);
    }

    result = result.sorted(x => x.sender === sender ? 0 : 1);

    return result;
  }

  static addToReceivers(receiver: string | undefined, receivers: string[] | undefined) {
    if (receiver) {
      if (!receivers) {
        receivers = [];
      }

      receivers.push(receiver);
    }
  }
}
