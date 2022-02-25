import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

export class TransactionOperation {
  id: string = '';

  action: TransactionOperationAction = TransactionOperationAction.none;

  type: TransactionOperationType = TransactionOperationType.none;

  esdtType?: TokenType;

  identifier: string = '';

  collection?: string;

  name?: string;

  value?: string;

  sender: string = '';

  receiver: string = '';

  decimals?: number;

  data?: string = '';

  message?: string = '';
}
