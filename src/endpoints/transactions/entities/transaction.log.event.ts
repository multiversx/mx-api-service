import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("TransactionLogEvent", { description: "Transaction log event object type." })
export class TransactionLogEvent {
  constructor(init?: Partial<TransactionLogEvent>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given transaction log event.' })
  @ApiProperty()
  address: string = '';

  @Field(() => String, { description: 'Identifier for the given transaction log event.' })
  @ApiProperty()
  identifier: string = '';

  @Field(() => [String], { description: 'Topics list for the given transaction log event.' })
  @ApiProperty()
  topics: string[] = [];

  @Field(() => String, { description: 'Data for the given transaction log event.', nullable: true })
  @ApiProperty()
  data: string = '';
}
