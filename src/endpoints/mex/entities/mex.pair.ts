import { ApiProperty } from "@nestjs/swagger";
import { MexPairState } from "./mex.pair.state";
import { MexPairType } from "./mex.pair.type";
import { MexPairExchange } from "./mex.pair.exchange";

export class MexPair {
  constructor(init?: Partial<MexPair>) {
    Object.assign(this, init);
  }

  @ApiProperty()
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
  basePrevious24hPrice: number = 0;

  @ApiProperty()
  quotePrevious24hPrice: number = 0;

  @ApiProperty({ type: String, example: 'MEX-455c57' })
  baseId: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  baseSymbol: string = '';

  @ApiProperty({ type: String, example: 'MEX' })
  baseName: string = '';

  @ApiProperty({ type: Number, example: 0.00020596180499578328 })
  basePrice: number = 0;

  @ApiProperty({ type: String, example: 'WEGLD-bd4d79' })
  quoteId: string = '';

  @ApiProperty({ type: String, example: 'WEGLD' })
  quoteSymbol: string = '';

  @ApiProperty({ type: String, example: 'WrappedEGLD' })
  quoteName: string = '';

  @ApiProperty({ type: Number, example: 145.26032 })
  quotePrice: number = 0;

  @ApiProperty({ type: Number, example: '347667206.84174806' })
  totalValue: number = 0;

  @ApiProperty({ type: Number, example: '2109423.4531209776' })
  volume24h: number | undefined;

  @ApiProperty({ enum: MexPairState })
  state: MexPairState = MexPairState.inactive;

  @ApiProperty({ enum: MexPairType })
  type: MexPairType = MexPairType.experimental;

  @ApiProperty({ type: String, example: 'jungledex' })
  exchange: MexPairExchange | undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  hasFarms: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  hasDualFarms: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  tradesCount: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  tradesCount24h: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  deployedAt: number | undefined = undefined;
}
