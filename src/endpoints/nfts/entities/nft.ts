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
  timestamp?: number = undefined;

  @ApiProperty()
  attributes: string = '';

  @ApiProperty()
  nonce: number = 0;

  @ApiProperty({ enum: NftType })
  type: NftType = NftType.NonFungibleESDT;

  @ApiProperty()
  name: string = '';

  @ApiProperty()
  creator: string = '';

  @ApiProperty({ type: Number, nullable: true })
  royalties: number | undefined = undefined;

  @ApiProperty()
  uris: string[] = [];

  @ApiProperty()
  url: string = '';

  @ApiProperty({ type: NftMedia })
  media: NftMedia[] | undefined = undefined;

  @ApiProperty()
  isWhitelistedStorage: boolean = false;

  @ApiProperty()
  thumbnailUrl: string = '';

  @ApiProperty()
  tags: string[] = [];

  @ApiProperty({ type: NftMetadata })
  metadata: NftMetadata | undefined = undefined;

  @ApiProperty({ type: String })
  owner: string | undefined = undefined;

  @ApiProperty({ type: String })
  balance: string | undefined = undefined;

  @ApiProperty({ type: String })
  supply: string | undefined = undefined;

  @ApiProperty({ type: Number })
  decimals: number | undefined = undefined;

  @ApiProperty()
  assets?: TokenAssets;

  @ApiProperty()
  ticker?: string;

  @ApiProperty({ type: String, nullable: true })
  scamInfo: any | undefined = undefined;
}
