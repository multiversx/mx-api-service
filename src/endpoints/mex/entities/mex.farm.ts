import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { MexFarmType } from "./mex.farm.type";

@ObjectType("MexFarm", { description: "MexFarm object type." })
export class MexFarm {
  constructor(init?: Partial<MexFarm>) {
    Object.assign(this, init);
  }

  @Field(() => MexFarmType, { description: "Mex farm type." })
  @ApiProperty({ enum: MexFarmType })
  type: MexFarmType = MexFarmType.standard;

  @Field(() => String, { description: "Address details." })
  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgqzps75vsk97w9nsx2cenv2r2tyxl4fl402jpsx78m9j' })
  address: string = '';

  @Field(() => String, { description: "Identifier farm details." })
  @ApiProperty()
  id: string = '';

  @Field(() => String, { description: "Symbol details." })
  @ApiProperty()
  symbol: string = '';

  @Field(() => String, { description: "Name details." })
  @ApiProperty()
  name: string = '';

  @Field(() => Float, { description: "Price details." })
  @ApiProperty()
  price: number = 0;

  @Field(() => String, { description: "Farming identifier details." })
  @ApiProperty()
  farmingId: string = '';

  @Field(() => String, { description: "Farming symbol details." })
  @ApiProperty()
  farmingSymbol: string = '';

  @Field(() => String, { description: "Farming name details." })
  @ApiProperty()
  farmingName: string = '';

  @Field(() => Float, { description: "Farming price details." })
  @ApiProperty()
  farmingPrice: number = 0;

  @Field(() => String, { description: "Farmed identifier details." })
  @ApiProperty()
  farmedId: string = '';

  @Field(() => String, { description: "Farmed symbol details." })
  @ApiProperty()
  farmedSymbol: string = '';

  @Field(() => String, { description: "Farmed name details." })
  @ApiProperty()
  farmedName: string = '';

  @Field(() => Float, { description: "Farmed price details." })
  @ApiProperty()
  farmedPrice: number = 0;
}
