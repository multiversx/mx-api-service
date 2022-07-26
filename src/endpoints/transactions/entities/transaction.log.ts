import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransactionLogEvent } from "./transaction.log.event";

export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  id: string | undefined = undefined;

  @ApiProperty()
  address: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true })
  addressAssets: AccountAssets | undefined = undefined;

  @ApiProperty()
  events: TransactionLogEvent[] = [];
}
