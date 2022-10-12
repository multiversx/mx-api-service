import { SwaggerUtils } from "@elrondnetwork/erdnest";
import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

@ObjectType("TokenDetailed", { description: "TokenDetailed object type." })
export class TokenDetailed extends Token {
  constructor(init?: Partial<TokenDetailed>) {
    super();
    Object.assign(this, init);
  }

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

  @Field(() => Boolean, { description: "Token canUpgrade property." })
  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @Field(() => String, { description: "Token supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Supply amount' }))
  supply: string | undefined = undefined;

  @Field(() => String, { description: "Token circulating supply amount details.", nullable: true })
  @ApiProperty(SwaggerUtils.amountPropertyOptions({ description: 'Circulating supply amount' }))
  circulatingSupply: string | undefined = undefined;

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
}
