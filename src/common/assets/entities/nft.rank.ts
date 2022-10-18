import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("NftRank", { description: "NFT rank object type" })
export class NftRank {
  @Field(() => String, { description: 'NFT identifier' })
  @ApiProperty({ type: String })
  identifier: string = '';

  @Field(() => Float, { description: 'NFT rank' })
  @ApiProperty({ type: Number })
  rank: number = 0;
}
