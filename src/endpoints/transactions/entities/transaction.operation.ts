import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "src/endpoints/tokens/entities/token.type";
import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

@ObjectType('TransactionOperation', { description: 'Transaction operation object type.' })
export class TransactionOperation {
  constructor(init?: Partial<TransactionOperation>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Identifier for the transaction operation.' })
  @ApiProperty({ type: String })
  id: string = '';

  @Field(() => TransactionOperationAction, { description: 'Transaction operation action for the transaction operation.' })
  @ApiProperty({ enum: TransactionOperationAction, default: TransactionOperationAction.none })
  action: TransactionOperationAction = TransactionOperationAction.none;

  @Field(() => TransactionOperationType, { description: 'Transaction operation type for the transaction operation.' })
  @ApiProperty({ enum: TransactionOperationType, default: TransactionOperationType.none })
  type: TransactionOperationType = TransactionOperationType.none;

  @Field(() => TokenType, { description: 'ESDT type for the transaction operation.', nullable: true})
  @ApiProperty({ enum: TokenType })
  esdtType?: TokenType;

  @Field(() => String, { description: 'Identifier for the transaction operation.' })
  @ApiProperty({ type: String })
  identifier: string = '';

  @Field(() => String, { description: 'Collection for the transaction operation.' })
  @ApiProperty({ type: String })
  collection?: string;

  @Field(() => String, { description: 'Name for the transaction operation.', nullable: true })
  @ApiProperty({ type: String })
  name?: string;

  @Field(() => String, { description: 'Value for the transaction operation.', nullable: true })
  @ApiProperty({ type: String })
  value?: string;

  @Field(() => String, { description: 'Sender address for the transaction operation.' })
  @ApiProperty({ type: String })
  sender: string = '';

  @Field(() => String, { description: 'Receiver address for the transaction operation.' })
  @ApiProperty({ type: String })
  receiver: string = '';

  @Field(() => Float, { description: 'Decimals for the transaction operation.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  decimals?: number;

  @Field(() => String, { description: 'Data for the transaction operation.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  data?: string;

  @Field(() => String, { description: 'Message for the transaction operation.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  message?: string;

  @Field(() => String, { description: 'SVG URL for the transaction operation.', nullable: true })
  @ApiProperty({ type: String, nullable: true })
  svgUrl?: string;
}
