import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "../../../common/assets/entities/token.assets";

export class Token {
  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String })
  name: string = '';

  @ApiProperty({ type: String })
  ticker: string = '';

  @ApiProperty({ type: String })
  owner: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minted: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  burnt: string = '';

  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  initialMinted: string = '';

  @ApiProperty({ type: Number })
  decimals: number = 0;

  @ApiProperty({ type: Boolean, default: false })
  isPaused: boolean = false;

  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transactions: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  accounts: number | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  marketCap: number | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | undefined = undefined;
}
