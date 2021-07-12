import { ApiProperty } from "@nestjs/swagger";
import { NftType } from "./nft.type";

export class NftElastic {
  @ApiProperty()
  identifier: string = '';

  @ApiProperty()
  collection: string = '';

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
  metadata: Object | undefined = undefined;
}