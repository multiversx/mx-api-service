import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType('TransactionReceipt', { description: 'Transaction receipt object type.' })
export class TransactionReceipt {
  constructor(init?: Partial<TransactionReceipt>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Value for the given transaction receipt.' })
  @ApiProperty()
  value: string = '';

  @Field(() => String, { description: 'Sender address for the given transaction receipt.' })
  @ApiProperty()
  sender: string = '';

  @Field(() => String, { description: 'Data for the given transaction receipt.' })
  @ApiProperty()
  data: string = '';
}
