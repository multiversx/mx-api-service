import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("AccountHistory", { description: "Detailed history object type that." })
export class AccountHistory {
  constructor(init?: Partial<AccountHistory>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address for the given account.' })
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'Balance for the given account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @Field(() => Float, { description: 'Timestamp for the given account.' })
  @ApiProperty({ type: Number, example: 10000 })
  timestamp: number = 0;

  @Field(() => Boolean, { description: 'IsSender for the given account.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true, example: true })
  isSender?: boolean | undefined = undefined;
}
