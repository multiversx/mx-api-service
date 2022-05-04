import { ApiProperty } from "@nestjs/swagger";

export class MexToken {

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  token?: string;

  @ApiProperty({ type: String, example: 'MEX' })
  name?: string;

  @ApiProperty({ type: String, example: '0.000206738758250580072306' })
  priceUsd?: string;

  @ApiProperty({ type: String, example: '0.000001418110772165' })
  priceEgld?: string;
}
