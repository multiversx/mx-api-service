import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { EsdtType } from "src/endpoints/esdt/entities/esdt.type";
import { TransactionOperationAction } from "./transaction.operation.action";
import { TransactionOperationType } from "./transaction.operation.type";

export class TransactionOperation {
  constructor(init?: Partial<TransactionOperation>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  id: string = '';

  @ApiProperty({ enum: TransactionOperationAction, default: TransactionOperationAction.none })
  action: TransactionOperationAction = TransactionOperationAction.none;

  @ApiProperty({ enum: TransactionOperationType, default: TransactionOperationType.none })
  type: TransactionOperationType = TransactionOperationType.none;

  @ApiProperty({ enum: EsdtType, required: false })
  esdtType?: EsdtType;

  @ApiProperty({ type: String, required: false })
  identifier: string = '';

  @ApiProperty({ type: String, required: false })
  ticker?: string = '';

  @ApiProperty({ type: String, required: false })
  collection?: string;

  @ApiProperty({ type: String, required: false })
  name?: string;

  @ApiProperty({ type: String, required: false })
  value?: string;

  @ApiProperty({ type: Number, required: false })
  valueUSD?: number;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  decimals?: number;

  @ApiProperty({ type: String, nullable: true, required: false })
  data?: string;

  @ApiProperty({ required: false })
  additionalData?: string[] = [];

  @ApiProperty({ type: String, nullable: true, required: false })
  message?: string;

  @ApiProperty({ type: String, nullable: true, required: false })
  svgUrl?: string;
}
