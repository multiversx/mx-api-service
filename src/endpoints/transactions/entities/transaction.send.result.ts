import { ApiProperty } from "@nestjs/swagger";

export class TransactionSendResult {
  constructor(init?: Partial<TransactionSendResult>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  receiver: string = '';

  @ApiProperty({ type: Number })
  receiverShard: number = 0;

  @ApiProperty({ type: String })
  sender: string = '';

  @ApiProperty({ type: Number })
  senderShard: number = 0;

  @ApiProperty({ type: String })
  status: string = '';

  @ApiProperty({ type: String })
  txHash: string = '';
}
