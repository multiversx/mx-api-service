import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("TokenRoles", { description: "TokenRoles object type." })
export class TokenRoles {
  constructor(init?: Partial<TokenRoles>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token address with role.", nullable: true })
  @ApiProperty({ type: String, nullable: true })
  address: string | undefined;

  @Field(() => Boolean, { description: "Token canLocalMint property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canLocalMint: boolean = false;

  @Field(() => Boolean, { description: "Token canLocalBurn property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canLocalBurn: boolean = false;

  @Field(() => Boolean, { description: "Token canCreate property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canCreate?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canBurn property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canBurn?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canAddQuantity property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canAddQuantity?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canUpdateAttributes property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canUpdateAttributes?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canAddUri property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canAddUri?: boolean = undefined;

  @Field(() => Boolean, { description: "Token canTransfer property.", nullable: true })
  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer?: boolean = undefined;

  @Field(() => [String], { description: "Token roles details." })
  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
