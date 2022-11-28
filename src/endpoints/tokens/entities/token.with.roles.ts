import { Field } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenWithRoles extends Token {
  constructor(init?: Partial<TokenWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => TokenRoles, { description: "The roles of the token." })
  @ApiProperty({ type: TokenRoles })
  roles: TokenRoles = new TokenRoles();

  @Field(() => String, { description: "Token address with role.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: String, nullable: true })
  address: string | undefined;

  @Field(() => Boolean, { description: "Token canLocalMint property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canLocalMint: boolean = false;

  @Field(() => Boolean, { description: "Token canLocalBurn property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canLocalBurn: boolean = false;

  @Field(() => Boolean, { description: "Token canCreate property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canCreate?: boolean = undefined;

  // @Field(() => Boolean, { description: "Token canBurn property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  // @ApiProperty({ type: Boolean, nullable: true })
  // canBurn?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canAddQuantity property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canAddQuantity?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canUpdateAttributes property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canUpdateAttributes?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canAddUri property.", nullable: true, deprecationReason: 'Already included in underlying roles structure' })
  @ApiProperty({ type: Boolean, nullable: true })
  canAddUri?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canTransfer property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean = false;
}
