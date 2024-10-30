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

  @ApiProperty({ enum: EsdtType })
  esdtType?: EsdtType;

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  ticker?: string = '';

  @ApiProperty({ type: String })
  collection?: string;

  @ApiProperty({ type: String })
  name?: string;

  @ApiProperty({ type: String })
  value?: string;

  @ApiProperty({ type: Number })
  valueUSD?: number;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  decimals?: number;

  @ApiProperty({ type: String, nullable: true })
  data?: string;

  @ApiProperty()
  additionalData?: string[] = [];

  @ApiProperty({ type: String, nullable: true })
  message?: string;

  @ApiProperty({ type: String, nullable: true })
  svgUrl?: string;
}
