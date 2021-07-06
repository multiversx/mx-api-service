import { ApiProperty } from "@nestjs/swagger";
import { NftType } from "./nft.type";

export class NftElastic {
  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  token: string = '';

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  attributes: string = '';

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  creator: string = '';

  @ApiProperty()
  royalties: number = 0;

  @ApiProperty()
  uris: string[] = [];

  @ApiProperty()
  url: string = '';

  @ApiProperty()
  tags: string[] = [];
  
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