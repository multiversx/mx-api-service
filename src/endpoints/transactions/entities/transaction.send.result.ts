import { ApiProperty } from "@nestjs/swagger";

export class TransactionSendResult {
  @ApiProperty()
  receiver: string = '';

  @ApiProperty()
  receiverShard: number = 0;

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  senderShard: number = 0;

  @ApiProperty()
  status: string = '';

  @ApiProperty()
  txHash: string = '';
}