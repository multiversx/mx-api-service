import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenDetailed extends Token {
  @ApiProperty({ type: Boolean, default: false })
  canUpgrade: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canMint: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canBurn: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canChangeOwner: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canPause: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canFreeze: boolean = false;

  @ApiProperty({ type: Boolean, default: false })
  canWipe: boolean = false;

  @ApiProperty({ type: String, nullable: true })
  supply: string | undefined = undefined;

  @ApiProperty({ type: String, nullable: true })
  circulatingSupply: string | undefined = undefined;

  @ApiProperty({ type: TokenRoles, nullable: true })
  roles: TokenRoles[] | undefined = undefined;
}
