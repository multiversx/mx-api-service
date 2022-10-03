import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType("Economics", { description: "Economics object type." })
export class Economics {
  constructor(init?: Partial<Economics>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  totalSupply: number = 0;

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  circulatingSupply: number = 0;

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  staked: number = 0;

  @Field(() => Float, { description: "Total Supply general information.", nullable: true })
  @ApiProperty({ type: Number })
  price: number | undefined = undefined;

  @Field(() => Float, { description: "Total Supply general information.", nullable: true })
  @ApiProperty({ type: Number })
  marketCap: number | undefined = undefined;

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  apr: number = 0;

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  topUpApr: number = 0;

  @Field(() => Float, { description: "Total Supply general information." })
  @ApiProperty()
  baseApr: number = 0;

  @Field(() => String, { description: "Total Supply general information.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  minimumAuctionTopUp: string | undefined = undefined;

  @Field(() => Float, { description: "Total Supply general information.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  tokenMarketCap: number | undefined = undefined;
}
