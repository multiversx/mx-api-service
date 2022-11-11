import { Field, Float, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("MexEconomics", { description: "MexEconomics object type." })
export class MexEconomics {
  constructor(init?: Partial<MexEconomics>) {
    Object.assign(this, init);
  }

  @Field(() => Float, { description: "Total supply details." })
  @ApiProperty({ type: Number, example: 8045920000000 })
  totalSupply: number = 0;

  @Field(() => Float, { description: "Circulating supply." })
  @ApiProperty({ type: Number, example: 4913924072690 })
  circulatingSupply: number = 0;

  @Field(() => Float, { description: "Mex current price." })
  @ApiProperty({ type: Number, example: 0.00020552146843751037 })
  price: number = 0;

  @Field(() => Float, { description: "Mex market cap." })
  @ApiProperty({ type: Number, example: 1009916891 })
  marketCap: number = 0;

  @Field(() => Float, { description: "Mex volume in 24h." })
  @ApiProperty({ type: Number, example: 13680479 })
  volume24h: number = 0;

  @Field(() => Float, { description: "Mex tokens pairs." })
  @ApiProperty({ type: Number, example: 15 })
  marketPairs: number = 0;
}
