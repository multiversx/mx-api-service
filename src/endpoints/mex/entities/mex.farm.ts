import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { MexFarmType } from "./mex.farm.type";
import { MexToken } from "./mex.token";

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

  static fromFarmQueryResponse(response: any): MexFarm {
    let price = Number(response.farmTokenPriceUSD);

    const symbol = response.farmToken.collection.split('-')[0];
    if (['EGLDUSDCF', 'EGLDUSDCFL'].includes(symbol)) {
      price = price / (10 ** 12) * 2;
    }

    const mexFarm = new MexFarm();
    mexFarm.type = MexFarmType.standard;
    mexFarm.address = response.address;
    mexFarm.id = response.farmToken.collection;
    mexFarm.symbol = symbol;
    mexFarm.name = response.farmToken.name;
    mexFarm.price = price;
    mexFarm.farmingId = response.farmingToken.identifier;
    mexFarm.farmingSymbol = response.farmingToken.identifier.split('-')[0];
    mexFarm.farmingName = response.farmingToken.name;
    mexFarm.farmingPrice = Number(response.farmingTokenPriceUSD);
    mexFarm.farmedId = response.farmedToken.identifier;
    mexFarm.farmedSymbol = response.farmedToken.identifier.split('-')[0];
    mexFarm.farmedName = response.farmedToken.name;
    mexFarm.farmedPrice = Number(response.farmedTokenPriceUSD);

    return mexFarm;
  }

  static fromStakingFarmResponse(response: any, pairs: Record<string, MexToken>): MexFarm {
    const price = pairs[response.farmingToken.identifier]?.price ?? 0;

    const mexFarm = new MexFarm();
    mexFarm.type = MexFarmType.metastaking;
    mexFarm.address = response.address;
    mexFarm.id = response.farmToken.collection;
    mexFarm.symbol = response.farmToken.collection.split('-')[0];
    mexFarm.name = response.farmToken.name;
    mexFarm.price = price;
    mexFarm.farmingId = response.farmingToken.identifier;
    mexFarm.farmingSymbol = response.farmingToken.identifier.split('-')[0];
    mexFarm.farmingName = response.farmingToken.name;
    mexFarm.farmingPrice = price;
    mexFarm.farmedId = response.farmingToken.identifier;
    mexFarm.farmedSymbol = response.farmingToken.identifier.split('-')[0];
    mexFarm.farmedName = response.farmingToken.name;
    mexFarm.farmedPrice = price;

    return mexFarm;
  }
}
