import { ApiProperty } from "@nestjs/swagger";

export class TransactionLog {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: string[] = [];

  @ApiProperty()
  data: string = '';
}