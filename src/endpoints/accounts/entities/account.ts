import { Field, Float, ID, ObjectType } from "@nestjs/graphql";
import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { AccountAssets } from "src/common/assets/entities/account.assets";

@ObjectType("Account", { description: "Account object type." })
export class Account {
  constructor(init?: Partial<Account>) {
    Object.assign(this, init);
  }

  @Field(() => ID, { description: 'Address for the given account.' })
  @ApiProperty({ type: String, description: 'Account bech32 address', example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'Balance for the given account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Account current balance' }))
  balance: string = '';

  @Field(() => Float, { description: 'Nonce for the given account.' })
  @ApiProperty({ type: Number, description: 'Account current nonce', example: 42 })
  nonce: number = 0;

  @Field(() => Float, { description: 'Timestamp of the block where the account was first indexed.' })
  @ApiProperty({ type: Number, description: 'Timestamp of the block where the account was first indexed', example: 1676979360 })
  timestamp: number = 0;

  @Field(() => Float, { description: 'Shard for the given account.' })
  @ApiProperty({ type: Number, description: 'The shard ID allocated to the account', example: 0 })
  shard: number = 0;

  @Field(() => String, { description: 'Current owner address.' })
  @ApiProperty({ type: String, description: 'Current owner address' })
  ownerAddress: string | undefined = undefined;

  @Field(() => AccountAssets, { description: 'Account assets for the given account.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  assets: AccountAssets | undefined = undefined;

  @Field(() => AccountAssets, { description: 'Owner Account Address assets details.', nullable: true })
  @ApiProperty({ type: AccountAssets, nullable: true, description: 'Account assets' })
  ownerAssets: AccountAssets | undefined = undefined;

  @Field(() => Boolean, { description: 'If the given detailed account is verified.', nullable: true })
  @ApiProperty({ description: 'Specific property flag for smart contract', type: Boolean })
  isVerified?: boolean;
}
