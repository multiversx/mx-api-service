import { ApiProperty } from "@nestjs/swagger";

export class TransactionReceipt {
  @ApiProperty()
  value: string = '';

  @ApiProperty()
  sender: string = '';

  @ApiProperty()
  data: string = '';
}