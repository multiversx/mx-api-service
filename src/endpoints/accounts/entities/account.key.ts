
import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("AccountKey", { description: "Account key object type." })
export class AccountKey {
  constructor(init?: Partial<AccountKey>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Bls key for the given provider account.' })
  @ApiProperty({ type: String, example: '2ef384d4d38bf3aad5cef34ce6eab047fba6d52b9735dbfdf7591289ed9c26ac7e816c9bb56ebf4f09129f045860f401275a91009befb4dc8ddc24ea4bc597290bd916b9f984c2a415ec9b2cfbc4a09de42c032314e6a21e69daf76302fcaa99' })
  blsKey: string = '';

  @Field(() => String, { description: 'Stake for the given provider account.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  stake: string = '';

  @Field(() => String, { description: 'Top Up for the given  provideraccount.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  topUp: string = '';

  @Field(() => String, { description: 'Status for the given provider account.' })
  @ApiProperty({ type: String, example: 'online' })
  status: string = '';

  @Field(() => String, { description: 'Reward address for the given provider account .' })
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  rewardAddress: string = '';

  @Field(() => String, { description: 'Queue index for the given provider account .', nullable: true })
  @ApiProperty({ type: String, nullable: true, example: '2' })
  queueIndex: string | undefined = undefined;

  @Field(() => String, { description: 'Queue size for the given provider account.', nullable: true })
  @ApiProperty({ type: String, nullable: true, example: '100' })
  queueSize: string | undefined = undefined;
}
