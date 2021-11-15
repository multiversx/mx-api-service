import { ApiProperty } from "@nestjs/swagger";

export class Transaction {
  @ApiProperty()
  txHash: string = '';

  @ApiProperty()
  gasLimit: number = 0;

  @ApiProperty()
  gasPrice: number = 0;

  @ApiProperty()
  gasUsed: number = 0;

  @ApiProperty()
  miniBlockHash: string = '';

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty()
  receiver: string = '';

  @ApiProperty()
  receiverShard: number = 0;

  @ApiProperty()
  round: number = 0;

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  senderShard: number = 0;

  @ApiProperty()
  signature: string = '';

  @ApiProperty()
  status: string = '';

  @ApiProperty()
  value: string = '';

  @ApiProperty()
  fee: string = '';

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  data: string = '';

  @ApiProperty()
  tokenIdentifier?: string;

  @ApiProperty()
  tokenValue?: string;

  @ApiProperty()
  action: any | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}