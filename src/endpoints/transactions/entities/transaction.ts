import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

export class Transaction {
  @ApiProperty()
  txHash: string = '';

  @ApiProperty({ type: Number })
  gasLimit: number | undefined = undefined;

  @ApiProperty({ type: Number })
  gasPrice: number | undefined = undefined;

  @ApiProperty({ type: Number })
  gasUsed: number | undefined = undefined;

  @ApiProperty({ type: String })
  miniBlockHash: string | undefined = undefined;

  @ApiProperty({ type: Number })
  nonce: number | undefined = undefined;

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @ApiProperty({ type: Number })
  round: number | undefined = undefined;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @ApiProperty({ type: String })
  signature: string | undefined = undefined;

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  value: string = '';

  @ApiProperty({ type: String })
  fee: string | undefined = undefined;

  @ApiProperty({ type: Number })
  timestamp: number = 0;

  @ApiProperty({ type: String })
  data: string | undefined = undefined;

  @ApiProperty({ type: String })
  function: string | undefined = undefined;

  @ApiProperty({ type: String })
  action: any | undefined = undefined;

  @ApiProperty()
  scamInfo: any | undefined = undefined;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType | undefined = undefined;

  @ApiProperty({ type: String })
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
