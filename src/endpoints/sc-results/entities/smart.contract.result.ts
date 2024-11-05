import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransactionAction } from "src/endpoints/transactions/transaction-action/entities/transaction.action";
import { TransactionLog } from "../../transactions/entities/transaction.log";

export class SmartContractResult {
  constructor(init?: Partial<SmartContractResult>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  hash: string = '';

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: Number })
  nonce: number = 0;

  @ApiProperty({ type: Number })
  gasLimit: number = 0;

  @ApiProperty({ type: Number })
  gasPrice: number = 0;

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  value: string = '';

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  senderAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: AccountAssets, nullable: true, required: false })
  receiverAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ type: String, required: false })
  relayedValue: string = '';

  @ApiProperty({ type: String })
  data: string = '';

  @ApiProperty({ type: String })
  prevTxHash: string = '';

  @ApiProperty({ type: String })
  originalTxHash: string = '';

  @ApiProperty({ type: String })
  callType: string = '';

  @ApiProperty({ type: String, nullable: true, required: false })
  miniBlockHash: string | undefined = undefined;

  @ApiProperty({ type: TransactionLog, nullable: true, required: false })
  logs: TransactionLog | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  returnMessage: string | undefined = undefined;

  @ApiProperty({ type: TransactionAction, nullable: true, required: false })
  action: TransactionAction | undefined = undefined;

  @ApiProperty({ type: String, nullable: true, required: false })
  function: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  status: string | undefined = undefined;
}
