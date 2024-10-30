import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransactionLogEvent } from "./transaction.log.event";

export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  @ApiProperty({ name: 'Transaction log ID', type: String })
  id: string | undefined = undefined;

  @ApiProperty({ name: 'Transaction log address', type: String })
  address: string = '';

  @ApiProperty({ name: 'Transaction address assets', type: AccountAssets, nullable: true })
  addressAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ name: 'Transaction log events', type: TransactionLogEvent, isArray: true })
  events: TransactionLogEvent[] = [];
}
