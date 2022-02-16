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

  static trimOperations(operations: TransactionOperation[]): TransactionOperation[] {
    const result: TransactionOperation[] = [];

    for (const operation of operations) {
      const identicalOperations = result.filter(x =>
        x.sender === operation.sender &&
        x.receiver === operation.receiver &&
        x.collection === operation.collection &&
        x.identifier === operation.identifier &&
        x.type === operation.type &&
        x.action === 'transfer'
      );

      if (identicalOperations.length > 0) {
        if (BigInt(identicalOperations[0].value) > BigInt(operation.value)) {
          result.remove(identicalOperations[0]);
        } else {
          continue;
        }
      }

      result.push(operation);
    }

    return result;
  }
}
