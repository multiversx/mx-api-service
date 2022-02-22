import { QueryConditionOptions } from "src/common/elastic/entities/query.condition.options";
import { TransactionFilter } from "src/endpoints/transactions/entities/transaction.filter";
import { TransactionOperation } from "src/endpoints/transactions/entities/transaction.operation";

export class TransactionUtils {
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

  static trimOperations(txHash: string, operations: TransactionOperation[]): TransactionOperation[] {
    const result: TransactionOperation[] = [];

    for (const operation of operations) {
      if (operation.action === 'transfer' && operation.id === txHash) {
        const identicalOperations = operations.filter(x =>
          x.sender === operation.sender &&
          x.receiver === operation.receiver &&
          x.collection === operation.collection &&
          x.identifier === operation.identifier &&
          x.type === operation.type &&
          x.value === operation.value &&
          x.action === 'transfer' &&
          x.id !== txHash
        );

        if (identicalOperations.length > 0) {
          continue;
        }
      }

      result.push(operation);
    }

    return result;
  }
}
