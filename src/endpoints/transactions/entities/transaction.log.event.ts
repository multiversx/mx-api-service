import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

@ObjectType("TransactionLogEvent", { description: "Transaction log event object type." })
export class TransactionLogEvent {
  constructor(init?: Partial<TransactionLogEvent>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given transaction log event.' })
  @ApiProperty()
  address: string = '';

  @Field(() => AccountAssets, { description: 'Address assets for the given transaction log event.' })
  @ApiProperty({ type: AccountAssets, nullable: true })
  addressAssets: AccountAssets | undefined = undefined;

  @Field(() => ID, { description: 'Identifier for the given transaction log event.' })
  @ApiProperty()
  identifier: string = '';

  @Field(() => [String], { description: 'Topics list for the given transaction log event.' })
  @ApiProperty()
  topics: string[] = [];

  @Field(() => String, { description: 'Data for the given transaction log event.', nullable: true })
  @ApiProperty()
  data: string = '';
}
