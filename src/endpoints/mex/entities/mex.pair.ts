import { ApiProperty } from "@nestjs/swagger";
import { MexPairState } from "./mex.pair.state";

export class MexPair {
  @ApiProperty()
  address: string = '';

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  baseId: string = '';

  @ApiProperty({ type: Number, example: 0.00020596180499578328 })
  basePrice: number = 0;

  @ApiProperty({ type: String, example: 'MEX' })
  baseSymbol: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  baseName: string = '';

  @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
  quoteId: string = '';

  @ApiProperty({ type: Number, example: 145.26032 })
  quotePrice: number = 0;

  @ApiProperty({ type: String, example: 'WEGLD' })
  quoteSymbol: string = '';

  @ApiProperty({ type: String, example: 'WrappedEGLD' })
  quoteName: string = '';

  @ApiProperty({ type: Number, example: '347667206.84174806' })
  totalValue: number = 0;

  @ApiProperty({ type: Number, example: '2109423.4531209776' })
  volume24h: number = 0;

  @ApiProperty({ enum: MexPairState })
  state: MexPairState = MexPairState.inactive;
}
