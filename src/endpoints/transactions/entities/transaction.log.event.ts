import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

export class TransactionLogEvent {
  constructor(init?: Partial<TransactionLogEvent>) {
    Object.assign(this, init);
  }

  @ApiProperty()
  address: string = '';

  @ApiProperty({ type: AccountAssets, nullable: true })
  addressAssets: AccountAssets | undefined = undefined;

  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  topics: string[] = [];

  @ApiProperty()
  data: string = '';
}
