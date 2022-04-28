import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

export class Transaction {
  @ApiProperty({ type: String })
  txHash: string = '';

  @ApiProperty({ type: Number, nullable: true })
  gasLimit: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  gasPrice: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  gasUsed: number | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  miniBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  nonce: number | undefined = undefined;

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @ApiProperty({ type: Number, nullable: true })
  round: number | undefined = undefined;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @ApiProperty({ type: String, nullable: true })
  signature: string | undefined = undefined;

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  value: string = '';

  @ApiProperty({ type: String, nullable: true })
  fee: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: String, nullable: true })
  data: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  function: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  action: any | undefined = undefined;

  @ApiProperty({ type: Object, nullable: true })
  scamInfo: any | undefined = undefined;

  @ApiProperty({ enum: TransactionType, nullable: true })
  type: TransactionType | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  originalTxHash: string | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  pendingResults: boolean | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}
