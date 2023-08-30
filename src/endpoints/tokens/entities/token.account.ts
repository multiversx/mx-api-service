import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

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

  @Field(() => String, { description: "Token identifier if MetaESDT.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  identifier: string | undefined = undefined;

  @Field(() => String, { description: "Token attributes if MetaESDT.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  attributes: string | undefined = undefined;

  @Field(() => AccountAssets, { description: 'Account assets for the given account.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  assets: AccountAssets | undefined = undefined;
}
