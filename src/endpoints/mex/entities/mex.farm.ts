import { ApiProperty } from "@nestjs/swagger";
import { MexFarmType } from "./mex.farm.type";

export class MexFarm {
  @ApiProperty({ enum: MexFarmType })
  type: MexFarmType = MexFarmType.standard;

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
}
