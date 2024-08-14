import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
@ObjectType("MexToken", { description: "MexToken object type." })
export class MexToken {
  constructor(init?: Partial<MexToken>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Identifier for the mex token." })
  @ApiProperty({ type: String, example: 'MEX-455c57' })
  id: string = '';

  @Field(() => String, { description: "Symbol for the mex token." })
  @ApiProperty({ type: String, example: 'MEX' })
  symbol: string = '';

  @Field(() => String, { description: "Mex token name." })
  @ApiProperty({ type: String, example: 'MEX' })
  name: string = '';

  @Field(() => Float, { description: "Mex token current price." })
  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  price: number = 0;

  @Field(() => Float, { description: "Mex token previous24hPrice." })
  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  previous24hPrice: number = 0;

  @Field(() => Float, { description: "Mex token previous24hVolume." })
  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  previous24hVolume: number | undefined = 0;

  @Field(() => Number, { description: 'Mex token trades count.', nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  tradesCount: number | undefined = 0;
}
