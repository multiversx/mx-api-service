import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

@ObjectType('TransactionOperation', { description: 'Transaction operation object type.' })
export class TransactionOperation {
  constructor(init?: Partial<TransactionOperation>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Identifier for the transaction operation.' })
  @ApiProperty({ type: String })
  id: string = '';

  @Field(() => TransactionOperationAction, { description: 'Transaction operation action for the transaction operation.' })
  @ApiProperty({ enum: TransactionOperationAction, default: TransactionOperationAction.none })
  action: TransactionOperationAction = TransactionOperationAction.none;

  @Field(() => TransactionOperationType, { description: 'Transaction operation type for the transaction operation.' })
  @ApiProperty({ enum: TransactionOperationType, default: TransactionOperationType.none })
  type: TransactionOperationType = TransactionOperationType.none;

  @Field(() => EsdtType, { description: 'ESDT type for the transaction operation.', nullable: true })
  @ApiProperty({ enum: EsdtType })
  esdtType?: EsdtType;

  @Field(() => String, { description: 'Identifier for the transaction operation.' })
  @ApiProperty({ type: String })
  identifier: string = '';

  @Field(() => String, { description: 'Token ticker for the transaction operation.' })
  @ApiProperty({ type: String })
  ticker?: string = '';

  @Field(() => String, { description: 'Collection for the transaction operation.', nullable: true })
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

  @Field(() => AccountAssets, { description: 'Sender account assets for the transaction operation.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true })
  senderAssets: AccountAssets | undefined = undefined;

  @Field(() => AccountAssets, { description: 'Receiver account assets for the transaction operation.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true })
  receiverAssets: AccountAssets | undefined = undefined;

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
