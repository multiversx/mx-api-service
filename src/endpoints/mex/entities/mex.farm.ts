import { ApiProperty } from "@nestjs/swagger";

export class MexFarm {
  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgqzps75vsk97w9nsx2cenv2r2tyxl4fl402jpsx78m9j' })
  address: string = '';

  @ApiProperty()
  farmingToken: string = '';

  @ApiProperty()
  farmedToken: string = '';
}
