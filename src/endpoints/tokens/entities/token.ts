import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, Float, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "../../../common/assets/entities/token.assets";

@ObjectType("Token", { description: "Token object type." })
export class Token {
  constructor(init?: Partial<Token>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token Identifier." })
  @ApiProperty({ type: String })
  identifier: string = '';

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

  @Field(() => Float, { description: "Tokens transactions.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  transactions: number | undefined = undefined;

  @Field(() => Float, { description: "Token accounts list." })
  @ApiProperty({ type: Number, nullable: true })
  accounts: number | undefined = undefined;

  @Field(() => Boolean, { description: "Token canUpgrade property." })
  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @Field(() => Boolean, { description: "Token canMint property." })
  @ApiProperty({ type: Boolean, default: false })
  canMint: boolean = false;

  @Field(() => Boolean, { description: "Token canBurn property." })
  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @Field(() => Boolean, { description: "Token canChangeOwner property." })
  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @Field(() => Boolean, { description: "Token canPause property." })
  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @Field(() => Boolean, { description: "Token canFreeze property." })
  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @Field(() => Boolean, { description: "Token canWipe property.", nullable: true })
  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @Field(() => Float, { description: "Current token price.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  price: number | undefined = undefined;

  @Field(() => Float, { description: "Current market cap details.", nullable: true })
  @ApiProperty({ type: Number, nullable: true })
  marketCap: number | undefined = undefined;

  @Field(() => String, { description: "Token supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | undefined = undefined;

  @Field(() => String, { description: "Token circulating supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | undefined = undefined;
}
