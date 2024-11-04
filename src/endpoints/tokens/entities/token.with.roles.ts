import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenWithRoles extends Token {
  constructor(init?: Partial<TokenWithRoles>) {
    super();
    Object.assign(this, init);
  }

  @ApiProperty({ type: TokenRoles })
  role: TokenRoles = new TokenRoles();

  @ApiProperty({ type: String, nullable: true })
  address: string | undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canLocalMint: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true })
  canLocalBurn: boolean = false;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canCreate?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canAddQuantity?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canUpdateAttributes?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true , required: false })
  canAddUri?: boolean = undefined;

  @ApiProperty({ type: Boolean, nullable: true })
  canTransfer: boolean = false;
}
