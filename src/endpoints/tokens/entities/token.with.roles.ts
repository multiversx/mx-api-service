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

  canTransfer: boolean = false;
}
