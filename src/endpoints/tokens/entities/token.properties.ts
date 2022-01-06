import { ApiProperty } from "@nestjs/swagger";
import { TokenType } from "./token.type";

export class TokenProperties {
  @ApiProperty()
  token: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  type: TokenType = TokenType.NonFungibleESDT;

  @ApiProperty()
  owner: string = '';

  @ApiProperty()
  minted: string = '';

  @ApiProperty()
  burnt: string = '';

  @ApiProperty()
  wiped: string = '';

  @ApiProperty()
  decimals: number = 0;

  @ApiProperty()
  isPaused: boolean = false;

  @ApiProperty()
  tags: string[] = [];

  @ApiProperty()
  royalties: number = 0;

  @ApiProperty()
  uris: string[] = [];

  @ApiProperty()
  url: string = '';

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
  canAddSpecialRoles: boolean = false;

  @ApiProperty()
  canTransferNFTCreateRole: boolean = false;

  @ApiProperty()
  NFTCreateStopped: boolean = false;
}