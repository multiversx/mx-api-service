import { ApiProperty } from "@nestjs/swagger";
import { MexToken } from "./mex.token";

export class MexFarm {

  @ApiProperty({ type: String, example: 'erd1qqqqqqqqqqqqqpgqzps75vsk97w9nsx2cenv2r2tyxl4fl402jpsx78m9j' })
  address: string = '';

  @ApiProperty({ type: MexToken })
  farmingToken: MexToken = new MexToken();

  @ApiProperty({ type: MexToken })
  farmedToken: MexToken = new MexToken();
}
