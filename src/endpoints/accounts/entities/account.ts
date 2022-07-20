import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

@ObjectType("Account", { description: "Account object type." })
export class Account {
  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Bech32 address for the given account.' })
  @ApiProperty({ type: String, description: 'Account bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'Current balance for the given account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @Field(() => Float, { description: 'Current nonce for the given account.' })
  @ApiProperty({ type: Number, description: 'Account current nonce', example: 42 })
  nonce: number = 0;

  @Field(() => Float, { description: 'Shard identifier for the given account.' })
  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account', example: 0 })
  shard: number = 0;

  @Field(() => AccountAssets, { description: 'Account assets list for the given account.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  assets: AccountAssets | undefined = undefined;
}
