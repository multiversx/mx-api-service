import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

export class TransactionOperation {
  action: TransactionOperationAction = TransactionOperationAction.none;

  type: TransactionOperationType = TransactionOperationType.none;

  identifier: string = '';

  collection?: string;

  value: string = '';

  sender: string = '';

  receiver: string = '';

  decimals?: number;
}