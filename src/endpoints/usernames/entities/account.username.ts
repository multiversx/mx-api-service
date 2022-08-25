import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Username", { description: "Username object type." })
export class AccountUsername {
  constructor(init?: Partial<AccountUsername>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: 'Address details.' })
  @ApiProperty({ type: String, example: 'erd1qga7ze0l03chfgru0a32wxqf2226nzrxnyhzer9lmudqhjgy7ycqjjyknz' })
  address: string = '';

  @Field(() => String, { description: 'Nonce details.', nullable: true })
  @ApiProperty({ type: Number, example: 12, nullable: true })
  nonce: number | undefined;

  @Field(() => String, { description: 'Balance details.' })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  balance: string = '';

  @Field(() => String, { description: 'RootHash details.' })
  @ApiProperty({ type: String, example: '829LsRk/pB5HCJZTvZzkBJ8g4ca1RiBpYjLzzK61pwM=' })
  rootHash: string = '';

  @Field(() => Number, { description: 'txCount details.', nullable: true })
  @ApiProperty({ type: Number, example: 47, nullable: true })
  txCount: number | undefined;

  @Field(() => String, { description: 'ScrCount details.', nullable: true })
  @ApiProperty({ type: Number, example: 49, nullable: true })
  scrCount: number | undefined;

  @Field(() => String, { description: 'Username details.' })
  @ApiProperty({ type: String, example: 'alice.elrond' })
  username: string = '';

  @Field(() => String, { description: 'Shard details.', nullable: true })
  @ApiProperty({ type: Number, example: 0, nullable: true })
  shard: number | undefined;

  @Field(() => String, { description: 'Developer Reward details.' })
  @ApiProperty({ type: String, default: 0 })
  developerReward: string = '';
}
