import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("TokenSupplyOptions", { description: "TokenSupplyOptions object." })
export class TokenSupplyOptions {
  constructor(init?: Partial<TokenSupplyOptions>) {
    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: "Token supply denominated details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  denominated?: boolean;
}
