import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "src/common/indexer/entities";
import { TokenAssets } from "../../../common/assets/entities/token.assets";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";
import { TokenOwnersHistory } from "./token.owner.history";
import { NftSubType } from "../../nfts/entities/nft.sub.type";

export class Token {
  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  @ApiProperty({ enum: TokenType })
  type: TokenType = TokenType.FungibleESDT;

  @ApiProperty({ enum: NftSubType })
  subType: NftSubType = NftSubType.None;

  @ApiProperty({ type: String })
  identifier: string = '';

  @ApiProperty({ type: String, nullable: true, required: false })
  collection: string | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  nonce: number | undefined = undefined;

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

  @ApiProperty({ type: TokenAssets, nullable: true, required: false })
  assets: TokenAssets | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transactions: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transactionsLastUpdatedAt: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transfers: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  transfersLastUpdatedAt: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  accounts: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true })
  accountsLastUpdatedAt: number | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canMint: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canBurn: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canChangeOwner: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canAddSpecialRoles: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canFreeze: boolean | undefined = undefined;

  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canTransferNftCreateRole: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  price: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  marketCap: number | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | number | undefined = undefined;

  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | number | undefined = undefined;

  @ApiProperty({ type: Number, description: 'Creation timestamp' })
  timestamp: number | undefined = undefined;

  @ApiProperty({ enum: MexPairType })
  mexPairType: MexPairType = MexPairType.experimental;

  @ApiProperty({ type: Number, nullable: true, required: false })
  totalLiquidity: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  totalVolume24h: number | undefined = undefined;

  @ApiProperty({ type: Boolean, nullable: true, required: false })
  isLowLiquidity: boolean | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  lowLiquidityThresholdPercent: number | undefined = undefined;

  @ApiProperty({ type: Number, nullable: true, required: false })
  tradesCount: number | undefined = undefined;

  @ApiProperty({ type: TokenOwnersHistory, nullable: true })
  ownersHistory: TokenOwnersHistory[] = [];
}
