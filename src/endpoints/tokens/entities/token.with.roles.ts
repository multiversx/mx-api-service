import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithLocalRoles {
  constructor(init?: Partial<TokenWithLocalRoles>) {
    Object.assign(this, init);
  }

  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;
}
export class TokenWithRoles extends Token {
  constructor(init?: Partial<TokenWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;

  @ApiProperty({ type: TokenWithLocalRoles, nullable: true })
  roles: TokenWithLocalRoles | undefined;
}
