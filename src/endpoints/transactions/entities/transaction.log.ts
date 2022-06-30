import { ApiProperty } from "@nestjs/swagger";
import { TransactionLogEvent } from "./transaction.log.event";

export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  id: string | undefined = undefined;

  @ApiProperty()
  address: string = '';

  @ApiProperty()
  events: TransactionLogEvent[] = [];
}
