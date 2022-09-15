import { Field, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@ObjectType("TokenRoles", { description: "TokenRoles object type." })
export class TokenRoles {
  constructor(init?: Partial<TokenRoles>) {
    Object.assign(this, init);
  }

  @Field(() => String, { description: "Token address with role." })
  @ApiProperty({ type: String })
  address: string = '';

  @Field(() => Boolean, { description: "Token canLocalMint property." })
  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @Field(() => Boolean, { description: "Token canLocalBurn property." })
  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;

  @Field(() => [String], { description: "Token roles details." })
  @ApiProperty({ type: [String] })
  roles: string[] = [];
}
