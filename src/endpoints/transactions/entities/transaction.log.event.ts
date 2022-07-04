import { ApiProperty } from "@nestjs/swagger";

export class TransactionLogEvent {
  constructor(init?: Partial<TransactionLogEvent>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  address: string = '';

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: string[] = [];

  @ApiProperty()
  data: string = '';
}
