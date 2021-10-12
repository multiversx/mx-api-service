import { ApiProperty } from "@nestjs/swagger";
import { NftType } from "./nft.type";

export class NftCollection {
  @ApiProperty()
  collection: string = '';

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  ticker: string = '';

  @ApiProperty()
  issuer: string = '';

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  isFreezable: boolean = false;
  
  @ApiProperty()
  isWipeable: boolean = false;

  @ApiProperty()
  isPausable: boolean = false;
  
  @ApiProperty()
  isRoleTransferable: boolean = false;
}