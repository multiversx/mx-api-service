import { ApiProperty } from "@nestjs/swagger";
import { TokenAssets } from "src/endpoints/tokens/entities/token.assets";
import { NftMedia } from "./nft.media";
import { NftMetadata } from "./nft.metadata";
import { NftType } from "./nft.type";

export class Nft {
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
  royalties: number | undefined = undefined;

  @ApiProperty()
  uris: string[] = [];

  @ApiProperty()
  url: string = '';

  @ApiProperty()
  media: NftMedia[] | undefined = undefined;

  @ApiProperty()
  isWhitelistedStorage: boolean = false;

  @ApiProperty()
  thumbnailUrl: string = '';

  @ApiProperty()
  tags: string[] = [];

  @ApiProperty()
  metadata: NftMetadata | undefined = undefined;

  @ApiProperty()
  owner: string | undefined = undefined;

  @ApiProperty()
  balance: string | undefined = undefined;

  @ApiProperty()
  supply: string | undefined = undefined;

  @ApiProperty()
  decimals: number | undefined = undefined;

  @ApiProperty()
  assets?: TokenAssets;

  @ApiProperty()
  ticker?: string;

  @ApiProperty()
  scamInfo: any | undefined = undefined;
}