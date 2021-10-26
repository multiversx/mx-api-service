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
  owner?: string;

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  canFreeze: boolean = false;
  
  @ApiProperty()
  canWipe: boolean = false;

  @ApiProperty()
  canPause: boolean = false;
  
  @ApiProperty()
  canTransferRole: boolean = false;

  @ApiProperty()
  decimals?: number;
}