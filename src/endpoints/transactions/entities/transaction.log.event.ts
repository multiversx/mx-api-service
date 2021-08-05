import { ApiProperty } from "@nestjs/swagger";

export class TransactionLogEvent {
  @ApiProperty()
  address: string = '';

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: string[] = [];

  @ApiProperty()
  data: string = '';
}