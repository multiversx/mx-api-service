import { Field, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

@ObjectType("TokenWithLocalRoles", { description: "TokenWithLocalRoles object type." })
export class TokenWithLocalRoles {
  constructor(init?: Partial<TokenWithLocalRoles>) {
    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: 'canLocalMint role for the given token.' })
  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @Field(() => Boolean, { description: 'canLocalBurn role for the given token.' })
  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;
}

@ObjectType("TokenWithRoles", { description: "TokenWithRoles object type." })
export class TokenWithRoles extends Token {
  constructor(init?: Partial<TokenWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @Field(() => Boolean, { description: 'canLocalMint role for the given token.' })
  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @Field(() => Boolean, { description: 'canLocalBurn role for the given token.' })
  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;

  @Field(() => TokenWithLocalRoles, { description: 'Account token roles details.' })
  @ApiProperty({ type: TokenWithLocalRoles, nullable: true })
  roles: TokenWithLocalRoles | undefined;
}
