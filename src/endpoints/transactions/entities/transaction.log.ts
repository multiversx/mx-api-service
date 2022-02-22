import { ApiProperty } from "@nestjs/swagger";
import { TransactionLogEvent } from "./transaction.log.event";

export class TransactionLog {
  id?: string;

  @ApiProperty()
  address: string = '';

  @ApiProperty()
  events: TransactionLogEvent[] = [];
}
