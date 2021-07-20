import { ApiProperty } from "@nestjs/swagger";

export class TransactionLog {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: Array<string> = [];

  @ApiProperty()
  data: string = '';
}