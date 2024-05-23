import { Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

export class ProviderAccounts {
  constructor(init?: Partial<ProviderAccounts>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address details.' })
  @ApiProperty({ type: String, nullable: true, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'Stake details.' })
  @ApiProperty({ type: String, nullable: true, example: '9999109666430000000' })
  stake: string = '';
}
