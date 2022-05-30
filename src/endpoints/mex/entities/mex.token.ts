import { ApiProperty } from "@nestjs/swagger";

export class MexToken {
  @ApiProperty({ type: String, example: 'MEX-455c57' })
  id: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  symbol: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  name: string = '';

  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  price: number = 0;
}
