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

  @Field(() => Boolean, { description: 'If the given NFT collection can transfer the underlying tokens by default.', nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean | undefined = undefined;
}
