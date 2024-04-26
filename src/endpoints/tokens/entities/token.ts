import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "src/common/indexer/entities";
import { TokenAssets } from "../../../common/assets/entities/token.assets";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";

@ObjectType("Token", { description: "Token object type." })
export class Token {
  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  @Field(() => TokenType, { description: "Token type." })
  @ApiProperty({ enum: TokenType })
  type: TokenType = TokenType.FungibleESDT;

  @Field(() => String, { description: "Token Identifier." })
  @ApiProperty({ type: String })
  identifier: string = '';

  @Field(() => String, { description: "Token Collection if type is MetaESDT.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  collection: string | undefined = undefined;

  @Field(() => Number, { description: "Token Nonce if type is MetaESDT.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  nonce: number | undefined = undefined;

  @Field(() => String, { description: "Token name." })
  @ApiProperty({ type: String })
  name: string = '';

  @Field(() => String, { description: "Token ticker." })
  @ApiProperty({ type: String })
  ticker: string = '';

  @Field(() => String, { description: "Token owner address." })
  @ApiProperty({ type: String })
  owner: string = '';

  @Field(() => String, { description: "Token minted details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  minted: string = '';

  @Field(() => String, { description: "Token burnt details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  burnt: string = '';

  @Field(() => String, { description: "Token initial minting details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions())
  initialMinted: string = '';

  @Field(() => Float, { description: "Token decimals." })
  @ApiProperty({ type: Number })
  decimals: number = 0;

  @Field(() => Boolean, { description: "Token isPause property." })
  @ApiProperty({ type: Boolean, default: false })
  isPaused: boolean = false;

  @Field(() => TokenAssets, { description: "Token assests details.", nullable: true })
  @ApiProperty({ type: TokenAssets, nullable: true })
  assets: TokenAssets | undefined = undefined;

  @Field(() => Float, { description: "Token transactions.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  transactions: number | undefined = undefined;

  @Field(() => Number, { description: "Token transactions last updated timestamp.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  transactionsLastUpdatedAt: number | undefined = undefined;

  @Field(() => Number, { description: "Token transfers.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  transfers: number | undefined = undefined;

  @Field(() => Number, { description: "Token transfers last updated timestamp.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  transfersLastUpdatedAt: number | undefined = undefined;

  @Field(() => Number, { description: "Token accounts." })
  @ApiProperty({ type: Number, nullable: true })
  accounts: number | undefined = undefined;

  @Field(() => Number, { description: "Token accounts last updated timestamp.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  accountsLastUpdatedAt: number | undefined = undefined;

  @Field(() => Boolean, { description: "Token canUpgrade property." })
  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @Field(() => Boolean, { description: "Token canMint property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canMint: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Token canBurn property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canBurn: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Token canChangeOwner property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canChangeOwner: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Token canAddSpecialRoles property in case of type MetaESDT.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canAddSpecialRoles: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Token canPause property." })
  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @Field(() => Boolean, { description: "Token canFreeze property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canFreeze: boolean | undefined = undefined;

  @Field(() => Boolean, { description: "Token canWipe property.", nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @Field(() => Boolean, { description: "Token canFreeze property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransferNftCreateRole: boolean | undefined = undefined;

  @Field(() => Float, { description: "Current token price.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @Field(() => Float, { description: "Current market cap details.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  marketCap: number | undefined = undefined;

  @Field(() => String, { description: "Token supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | number | undefined = undefined;

  @Field(() => String, { description: "Token circulating supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | number | undefined = undefined;

  @Field(() => Number, { description: "Creation timestamp." })
  @ApiProperty({ type: Number, description: 'Creation timestamp' })
  timestamp: number | undefined = undefined;

  @Field(() => MexPairType, { description: "Mex pair type details." })
  @ApiProperty({ enum: MexPairType })
  mexPairType: MexPairType = MexPairType.experimental;

  @Field(() => Number, { description: "Total value captured in liquidity pools." })
  @ApiProperty({ type: Number, nullable: true })
  totalLiquidity: number | undefined = undefined;

  @Field(() => Number, { description: "Total traded value in the last 24h within the liquidity pools." })
  @ApiProperty({ type: Number, nullable: true })
  totalVolume24h: number | undefined = undefined;

  @Field(() => Boolean, { description: 'If the liquidity to market cap ratio is less than 1%, we consider it as low liquidity.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  isLowLiquidity: boolean | undefined = undefined;
}
