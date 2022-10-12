import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("TokenAccount", { description: "TokenAccount object type." })
export class TokenAccount {
  constructor(init?: Partial<TokenAccount>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token account address." })
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = "";

  @Field(() => String, { description: "Token balance account amount." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = "";
}
