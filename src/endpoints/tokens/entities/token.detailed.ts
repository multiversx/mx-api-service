import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenRoles } from "./token.roles";

export class TokenDetailed extends Token {
  @ApiProperty()
  supply: string | undefined = undefined;

  @ApiProperty()
  circulatingSupply: string | undefined = undefined;

  @ApiProperty()
  roles: TokenRoles[] | undefined = undefined;

  @ApiProperty()
  minted: string = '';

  @ApiProperty()
  burnt: string = '';

  @ApiProperty()
  initialMinted: string = '';
}
