import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenDetailed extends Token {
  @ApiProperty()
  canUpgrade: boolean = false;

  @ApiProperty()
  canMint: boolean = false;

  @ApiProperty()
  canBurn: boolean = false;

  @ApiProperty()
  canChangeOwner: boolean = false;

  @ApiProperty()
  canPause: boolean = false;

  @ApiProperty()
  canFreeze: boolean = false;

  @ApiProperty()
  canWipe: boolean = false;

  @ApiProperty({ type: String })
  supply: string | undefined = undefined;

  @ApiProperty({ type: String })
  circulatingSupply: string | undefined = undefined;

  @ApiProperty({ type: TokenRoles })
  roles: TokenRoles[] | undefined = undefined;
}
