import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";

export class TokenWithRoles extends Token {
  constructor(init?: Partial<TokenWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: Boolean, default: false })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canLocalBurn: boolean = false;
}
