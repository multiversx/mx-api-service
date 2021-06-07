import { ApiProperty } from "@nestjs/swagger";
import { Nft } from "./nft";

export class NftDetailed extends Nft {
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