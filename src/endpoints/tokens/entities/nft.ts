import { ApiProperty } from "@nestjs/swagger";
import { NftType } from "./nft.type";

export class Nft {
  @ApiProperty()
  token: string = '';

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  type: NftType = NftType.NonFungibleESDT;

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
}