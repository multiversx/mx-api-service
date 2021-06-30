import { ApiProperty } from "@nestjs/swagger";
import { Token } from "./token";
import { TokenAssets } from "./token.assets";

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

  @ApiProperty()
  assets: TokenAssets | undefined = undefined;
}