import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("WaitingList", { description: "Waiting object type." })
export class WaitingList {
  constructor(init?: Partial<WaitingList>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Address details.' })
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => Number, { description: 'Nonce details.' })
  @ApiProperty({ type: Number, example: 46 })
  nonce: number = 0;

  @Field(() => Number, { description: 'Rank details.' })
  @ApiProperty({ type: Number, example: 2 })
  rank: number = 0;

  @Field(() => Number, { description: 'Value details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  value: string = '';
}
