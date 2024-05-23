import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { MexPairState } from "./mex.pair.state";
import { MexPairType } from "./mex.pair.type";
import { MexPairExchange } from "./mex.pair.exchange";

@ObjectType("MexPair", { description: "MexPair object type." })
export class MexPair {
  constructor(init?: Partial<MexPair>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Address details." })
  @ApiProperty()
  address: string = '';

  @Field(() => String, { description: "Id details." })
  @ApiProperty()
  id: string = '';

  @Field(() => String, { description: "Pair symbol details." })
  @ApiProperty()
  symbol: string = '';

  @Field(() => String, { description: "Pair name details." })
  @ApiProperty()
  name: string = '';

  @Field(() => String, { description: "Mex token price equivalent" })
  @ApiProperty()
  price: number = 0;

  @Field(() => Number, { description: "Mex token basePrevious24hPrice equivalent" })
  @ApiProperty()
  basePrevious24hPrice: number = 0;

  @Field(() => Number, { description: "Mex token quotePrevious24hPrice equivalent" })
  @ApiProperty()
  quotePrevious24hPrice: number = 0;

  @Field(() => String, { description: "Base id details." })
  @ApiProperty({ type: String, example: 'MEX-455c57' })
  baseId: string = '';

  @Field(() => String, { description: "Base symbol details." })
  @ApiProperty({ type: String, example: 'MEX' })
  baseSymbol: string = '';

  @Field(() => String, { description: "Base name details." })
  @ApiProperty({ type: String, example: 'MEX' })
  baseName: string = '';

  @Field(() => String, { description: "Base price details." })
  @ApiProperty({ type: Number, example: 0.00020596180499578328 })
  basePrice: number = 0;

  @Field(() => String, { description: "Quote id details." })
  @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
  quoteId: string = '';

  @Field(() => String, { description: "Quote symbol details." })
  @ApiProperty({ type: String, example: 'WEGLD' })
  quoteSymbol: string = '';

  @Field(() => String, { description: "Quote name details." })
  @ApiProperty({ type: String, example: 'WrappedEGLD' })
  quoteName: string = '';

  @Field(() => String, { description: "Quote price details." })
  @ApiProperty({ type: Number, example: 145.26032 })
  quotePrice: number = 0;

  @Field(() => String, { description: "Total value details." })
  @ApiProperty({ type: Number, example: '347667206.84174806' })
  totalValue: number = 0;

  @Field(() => String, { description: "Total volume in 24h details.", nullable: true })
  @ApiProperty({ type: Number, example: '2109423.4531209776' })
  volume24h: number | undefined;

  @Field(() => MexPairState, { description: "State details." })
  @ApiProperty({ enum: MexPairState })
  state: MexPairState = MexPairState.inactive;

  @Field(() => MexPairType, { description: "Mex pair type details." })
  @ApiProperty({ enum: MexPairType })
  type: MexPairType = MexPairType.experimental;

  @Field(() => String, { description: "Mex pair exchange details.", nullable: true })
  @ApiProperty({ type: String, example: 'jungledex' })
  exchange: MexPairExchange | undefined;

  @Field(() => Boolean, { description: "Has farm pair details.", nullable: true })
  @ApiProperty({ type: Boolean, example: false })
  hasFarms: boolean | undefined;

  @Field(() => Boolean, { description: "Has dual farm pair details.", nullable: true })
  @ApiProperty({ type: Boolean, example: false })
  hasDualFarms: boolean | undefined;

  @Field(() => Float, { description: "Pair trades count details.", nullable: true })
  @ApiProperty({ type: Number, example: 100 })
  tradesCount: number | undefined;
}
