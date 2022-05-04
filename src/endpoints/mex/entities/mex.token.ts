import { ApiProperty } from "@nestjs/swagger";

export class MexToken {

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  token: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  name: string = '';

  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  priceUsd: number = 0;

  @ApiProperty({ type: Number, example: 0.000001418110772165 })
  priceEgld: number = 0;
}
