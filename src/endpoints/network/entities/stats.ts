import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("Stats", { description: "Stats object type." })
export class Stats {
  constructor(init?: Partial<Stats>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total number of accounts available on blockchain." })
  @ApiProperty()
  accounts: number = 0;

  @Field(() => Float, { description: "Total blocks available on blockchain." })
  @ApiProperty()
  blocks: number = 0;

  @Field(() => Float, { description: "Current epoch details." })
  @ApiProperty()
  epoch: number = 0;

  @Field(() => Float, { description: "RefreshRate details." })
  @ApiProperty()
  refreshRate: number = 0;

  @Field(() => Float, { description: "RoundPassed details." })
  @ApiProperty()
  roundsPassed: number = 0;

  @Field(() => Float, { description: "Rounds per epoch details." })
  @ApiProperty()
  roundsPerEpoch: number = 0;

  @Field(() => Float, { description: "Shards available on blockchain." })
  @ApiProperty()
  shards: number = 0;

  @Field(() => Float, { description: "Total number of transactions." })
  @ApiProperty()
  transactions: number = 0;
}
