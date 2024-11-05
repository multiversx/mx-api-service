import { ApiProperty } from "@nestjs/swagger";
import { MexFarmType } from "./mex.farm.type";
import { MexToken } from "./mex.token";

export class MexFarm {
  constructor(init?: Partial<MexFarm>) {
    Object.assign(this, init);
  }

  @ApiProperty({ enum: MexFarmType })
  type: MexFarmType = MexFarmType.standard;

  @ApiProperty({ nullable: true, required: false })
  version?: string;

  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgqzps75vsk97w9nsx2cenv2r2tyxl4fl402jpsx78m9j' })
  address: string = '';

  @ApiProperty()
  id: string = '';

  @ApiProperty()
  symbol: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  price: number = 0;

  @ApiProperty()
  farmingId: string = '';

  @ApiProperty()
  farmingSymbol: string = '';

  @ApiProperty()
  farmingName: string = '';

  @ApiProperty()
  farmingPrice: number = 0;

  @ApiProperty()
  farmedId: string = '';

  @ApiProperty()
  farmedSymbol: string = '';

  @ApiProperty()
  farmedName: string = '';

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
    mexFarm.version = response.version;
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
