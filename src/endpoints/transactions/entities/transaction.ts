import { ApiProperty } from "@nestjs/swagger";
import { TransactionType } from "src/endpoints/transactions/entities/transaction.type";

export class Transaction {
  @ApiProperty()
  txHash: string = '';

  @ApiProperty()
  gasLimit: number | undefined = undefined;

  @ApiProperty()
  gasPrice: number | undefined = undefined;

  @ApiProperty()
  gasUsed: number | undefined = undefined;

  @ApiProperty()
  miniBlockHash: string | undefined = undefined;

  @ApiProperty()
  nonce: number | undefined = undefined;

  @ApiProperty()
  receiver: string = '';

  @ApiProperty()
  receiverShard: number = 0;

  @ApiProperty()
  round: number | undefined = undefined;

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  senderShard: number = 0;

  @ApiProperty()
  signature: string | undefined = undefined;

  @ApiProperty()
  status: string = '';

  @ApiProperty()
  value: string = '';

  @ApiProperty()
  fee: string | undefined = undefined;

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  data: string | undefined = undefined;

  @ApiProperty()
  function: string | undefined = undefined;

  @ApiProperty()
  action: any | undefined = undefined;

  @ApiProperty()
  scamInfo: any | undefined = undefined;

  @ApiProperty()
  type: TransactionType | undefined = undefined;

  @ApiProperty()
  originalTxHash: string | undefined = undefined;

  getDate(): Date | undefined {
    if (this.timestamp) {
      return new Date(this.timestamp * 1000);
    }

    return undefined;
  }
}
