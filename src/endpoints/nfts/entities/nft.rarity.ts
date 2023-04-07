import { Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

export class NftRarity {
  constructor(init?: Partial<NftRarity>) {
    Object.assign(this, init);
  }

  @Field(() => Number, { description: "Rank for the given algorithm." })
  @ApiProperty({ type: Number })
  rank: number = 0;

  @Field(() => Number, { description: "Score for the given algorithm." })
  @ApiProperty({ type: Number })
  score: number = 0;
}
