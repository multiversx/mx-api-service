import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

export class TransactionOperation {
  @ApiProperty({ type: String })
  id: string = '';

  @ApiProperty({ enum: TransactionOperationAction, default: TransactionOperationAction.none })
  action: TransactionOperationAction = TransactionOperationAction.none;

  @ApiProperty({ enum: TransactionOperationType, default: TransactionOperationType.none })
  type: TransactionOperationType = TransactionOperationType.none;

  @ApiProperty({ enum: TokenType })
  esdtType?: TokenType;

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  collection?: string;

  @ApiProperty({ type: String })
  name?: string;

  @ApiProperty({ type: String })
  value?: string;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: Number })
  decimals?: number;

  @ApiProperty({ type: String })
  data?: string = '';

  @ApiProperty({ type: String })
  message?: string = '';
}
