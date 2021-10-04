import { ApiProperty } from "@nestjs/swagger";

export class NftCollection {
  @ApiProperty()
  collection: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  ticker: string = '';

  @ApiProperty()
  issuer: string = '';

  @ApiProperty()
  timestamp: number = 0;

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