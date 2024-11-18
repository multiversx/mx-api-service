import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransactionLogEvent } from "./transaction.log.event";

export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  @ApiProperty({ description: 'Transaction log ID', type: String })
  id: string | undefined = undefined;

  @ApiProperty({ description: 'Transaction log address', type: String })
  address: string = '';

  @ApiProperty({ description: 'Transaction address assets', type: AccountAssets, nullable: true, required: false })
  addressAssets: AccountAssets | undefined = undefined;

  @ApiProperty({ description: 'Transaction log events', type: TransactionLogEvent, isArray: true })
  events: TransactionLogEvent[] = [];
}
