import { ApiProperty } from "@nestjs/swagger";
import { NftType } from "./nft.type";

export class NftElastic {
  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  token: string = '';

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  timestamp: number = 0;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  creator: string = '';

  @ApiProperty()
  royalties: number = 0;

  @ApiProperty()
  hash: string = '';

  @ApiProperty()
  uris: string[] = [];

  @ApiProperty()
  url: string = '';

  @ApiProperty()
  tags: string[] = [];
}