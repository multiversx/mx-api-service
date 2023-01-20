import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("AccountUndelegation", { description: "Account undelegation object type that extends Account." })
export class AccountUndelegation {
  constructor(init?: Partial<AccountUndelegation>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Amount for the given detailed account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  amount: string = '';

  @Field(() => Float, { description: 'Seconds for the given detailed account.' })
  @ApiProperty({ type: Number })
  seconds: number = 0;
}
