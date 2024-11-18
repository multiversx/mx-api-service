import { ApiProperty } from "@nestjs/swagger";
export class MexToken {
  constructor(init?: Partial<MexToken>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  id: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  symbol: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  name: string = '';

  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  price: number = 0;

  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  previous24hPrice: number = 0;

  @ApiProperty({ type: Number, example: 0.000206738758250580 })
  previous24hVolume: number | undefined = 0;

  @ApiProperty({ type: Number, nullable: true })
  tradesCount: number | undefined = 0;
}
