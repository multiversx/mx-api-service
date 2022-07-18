import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TransactionLogEvent } from "./transaction.log.event";

@ObjectType("TransactionLog", { description: "Transaction log object type." })
export class TransactionLog {
  constructor(init?: Partial<TransactionLog>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Identifier for the given transaction log.' })
  id: string | undefined = undefined;

  @Field(() => String, { description: 'Address for the given transaction log.' })
  @ApiProperty()
  address: string = '';

  @Field(() => [TransactionLogEvent], { description: 'Transaction log events list for the given transaction log.' })
  @ApiProperty()
  events: TransactionLogEvent[] = [];
}
