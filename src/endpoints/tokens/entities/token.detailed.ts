import { SwaggerUtils } from "@multiversx/sdk-nestjs-common";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";
import { MexPairType } from "src/endpoints/mex/entities/mex.pair.type";

@ObjectType("TokenDetailed", { description: "TokenDetailed object type." })
export class TokenDetailed extends Token {
  constructor(init?: Partial<TokenDetailed>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | number | undefined = undefined;

  @Field(() => String, { description: "Token circulating supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | number | undefined = undefined;

  @Field(() => [TokenRoles], { description: "Token roles details.", nullable: true })
  @ApiProperty({ type: TokenRoles, nullable: true, isArray: true })
  roles: TokenRoles[] | undefined = undefined;

  @Field(() => String, { description: "Token minted amount details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Minted amount' }))
  minted: string = '';

  @Field(() => String, { description: "Token burn amount details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Burnt amount' }))
  burnt: string = '';

  @Field(() => String, { description: "Token initial minted amount details." })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Initial minted amount' }))
  initialMinted: string = '';

  @Field(() => Boolean, { description: 'If the given NFT collection can transfer the underlying tokens by default.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean | undefined = undefined;

  @Field(() => MexPairType, { description: "Mex pair type details." })
  @ApiProperty({ enum: MexPairType })
  mexPairType: MexPairType = MexPairType.experimental;

  @Field(() => Number, { description: "Total value captured in liquidity pools." })
  @ApiProperty({ type: Number, nullable: true })
  totalLiquidity: number | undefined = undefined;

  @Field(() => Boolean, { description: 'If the liquidity to market cap ratio is less than 1%, we consider it as low liquidity.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  isLowLiquidity: boolean | undefined = undefined;
}
