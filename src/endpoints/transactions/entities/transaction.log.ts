import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";
import { TransactionLogEvent } from "./transaction.log.event";

@ObjectType("TransactionLog", { description: "Transaction log object type." })
export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Identifier for the given transaction log.' })
  id: string | undefined = undefined;

  @Field(() => String, { description: 'Address for the given transaction log.' })
  @ApiProperty()
  address: string = '';

  @Field(() => String, { description: 'Account herotag for the given transaction log.' })
  @ApiProperty()
  addressHerotag: string = '';

  @Field(() => AccountAssets, { description: 'Account assets for the given transaction log.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true })
  addressAssets: AccountAssets | undefined = undefined;

  @Field(() => [TransactionLogEvent], { description: 'Transaction log events list for the given transaction log.' })
  @ApiProperty()
  events: TransactionLogEvent[] = [];
}
